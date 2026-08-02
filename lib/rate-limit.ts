/**
 * Minimal in-memory sliding-window rate limiter for API routes.
 *
 * Limitation: on serverless platforms (e.g. Vercel) each function instance
 * has its own memory, so this only throttles requests that land on the same
 * warm instance — it's a soft throttle, not a hard guarantee. That's
 * sufficient to stop casual bot abuse on a small clinic site; if traffic
 * grows enough to need a real guarantee, swap this for a shared store like
 * Upstash Redis or Vercel KV.
 */

const MAX_TRACKED_KEYS = 5000;

// Module scope: persists across requests within the same server instance.
const hits = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  opts: { limit: number; windowMs: number }
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const windowStart = now - opts.windowMs;

  const timestamps = (hits.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= opts.limit) {
    const oldest = timestamps[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + opts.windowMs - now) / 1000));
    hits.set(key, timestamps);
    return { allowed: false, retryAfterSeconds };
  }

  timestamps.push(now);
  hits.set(key, timestamps);

  // Cap total map size so an ever-growing set of distinct keys (e.g. spoofed
  // IPs) can't grow the map unbounded — evict the oldest-looking entries.
  if (hits.size > MAX_TRACKED_KEYS) {
    let toEvict = hits.size - MAX_TRACKED_KEYS;
    for (const mapKey of hits.keys()) {
      if (toEvict <= 0) break;
      hits.delete(mapKey);
      toEvict -= 1;
    }
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Derives the client IP from standard proxy headers. Falls back to
 * "unknown" when neither header is present (e.g. some local/dev requests).
 *
 * `x-real-ip` is set by the platform's own edge/proxy and can't be
 * overridden by the client, so it's trusted first. For `x-forwarded-for`,
 * the LEFTMOST entry is whatever the client sent and is trivially spoofable
 * (a scripted attacker can send a fresh value per request to dodge the rate
 * limit); the RIGHTMOST entry is the one appended by our own trusted
 * edge hop, so that's the one we trust.
 */
export function getClientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor.split(",").map((p) => p.trim()).filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) return last;
  }

  return "unknown";
}

/**
 * Same-origin check for state-changing API routes. Only enforced when both
 * an Origin header and NEXT_PUBLIC_SITE_URL are present, so it never blocks
 * server-to-server calls (health checks, curl, etc.) or local dev.
 */
export function isAllowedOrigin(originHeader: string | null): boolean {
  if (!originHeader) return true;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return true;

  let originHost: string;
  let siteHost: string;
  try {
    originHost = new URL(originHeader).host;
    siteHost = new URL(siteUrl).host;
  } catch {
    // Malformed header/env value — don't block on something we can't parse.
    return true;
  }

  if (originHost === siteHost) return true;

  const originHostname = originHost.split(":")[0];
  if (originHostname === "localhost" || originHostname === "127.0.0.1") return true;

  return false;
}
