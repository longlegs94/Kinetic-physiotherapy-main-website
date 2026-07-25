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
 * x-forwarded-for is a comma-separated list that each proxy *appends* to
 * (client, proxy1, proxy2, ...). The first entry is whatever the client
 * claims and is trivially spoofable; on Vercel the last entry is the one
 * the edge network appended based on the real TCP connection, so it's the
 * only hop that's actually trustworthy for rate-limiting.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor.split(",");
    const last = parts[parts.length - 1]?.trim();
    if (last) return last;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}

/**
 * Same-origin check for state-changing API routes. Falls back to comparing
 * against the request's own Host header when NEXT_PUBLIC_SITE_URL isn't
 * set, so the check still enforces same-origin instead of failing open.
 */
export function isAllowedOrigin(originHeader: string | null, request: Request): boolean {
  if (!originHeader) return true;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const host = request.headers.get("host");

  let originHost: string;
  try {
    originHost = new URL(originHeader).host;
  } catch {
    // Malformed Origin header — don't block on something we can't parse.
    return true;
  }

  if (siteUrl) {
    try {
      if (originHost === new URL(siteUrl).host) return true;
    } catch {
      // Malformed env value — fall through to the Host-header comparison.
    }
  }

  if (host && originHost === host) return true;

  const originHostname = originHost.split(":")[0];
  if (originHostname === "localhost" || originHostname === "127.0.0.1") return true;

  return false;
}
