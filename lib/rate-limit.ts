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
 * x-forwarded-for is a comma-separated hop chain ("client, proxy1, proxy2, ...")
 * that proxies APPEND to rather than overwrite — so the LAST entry is the one
 * added by the proxy immediately in front of this server (trustworthy on a
 * single-hop platform like Vercel), while the FIRST entry is whatever the
 * original request supplied, which a client can set to anything. Reading the
 * first entry (as this used to) let a request forge its own rate-limit key.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor.split(",").map((p) => p.trim()).filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) return last;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}

/**
 * Same-origin check for state-changing API routes. Prefers comparing against
 * the request's own Host header (always available, can't be misconfigured)
 * and falls back to NEXT_PUBLIC_SITE_URL only if Host is somehow missing.
 * Only blocks when an Origin header is present and resolvable — this never
 * blocks server-to-server calls (health checks, curl, etc.) or local dev,
 * which typically send no Origin header at all.
 */
export function isAllowedOrigin(originHeader: string | null, hostHeader: string | null = null): boolean {
  if (!originHeader) return true;

  let originHost: string;
  try {
    originHost = new URL(originHeader).host;
  } catch {
    // Malformed Origin header — don't block on something we can't parse.
    return true;
  }

  if (hostHeader && originHost === hostHeader) return true;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    try {
      if (originHost === new URL(siteUrl).host) return true;
    } catch {
      // Malformed env value — fall through to the localhost/failure checks.
    }
  }

  const originHostname = originHost.split(":")[0];
  if (originHostname === "localhost" || originHostname === "127.0.0.1") return true;

  return false;
}
