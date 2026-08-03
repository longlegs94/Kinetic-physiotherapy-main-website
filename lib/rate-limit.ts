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
 * x-forwarded-for is a hop chain that each proxy *appends* to as it forwards
 * a request — a client can set this header to anything it wants, but cannot
 * add an entry after our own trusted edge/proxy has already appended its
 * observed address. So the last entry is the one we can trust; the first
 * (client-supplied) entry is not, and using it lets a client get a fresh
 * rate-limit bucket on every request just by sending a random value.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const trusted = parts[parts.length - 1];
    if (trusted) return trusted;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}

/**
 * Same-origin check for state-changing API routes. Only enforced when
 * NEXT_PUBLIC_SITE_URL is present, so it never blocks local dev where no
 * baseline is configured.
 *
 * A real browser reliably sends an Origin header (and, failing that, a
 * Referer) on same-origin POST fetches from our own client components. A
 * request with neither is not something our site's JS produces, so it's
 * treated as disallowed rather than silently waved through — otherwise a
 * non-browser script can skip the header entirely and bypass this check.
 */
export function isAllowedOrigin(originHeader: string | null, refererHeader?: string | null): boolean {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return true;

  const candidate = originHeader || refererHeader || null;
  if (!candidate) return false;

  let candidateHost: string;
  let siteHost: string;
  try {
    candidateHost = new URL(candidate).host;
    siteHost = new URL(siteUrl).host;
  } catch {
    // Malformed header/env value — don't block on something we can't parse.
    return true;
  }

  if (candidateHost === siteHost) return true;

  const candidateHostname = candidateHost.split(":")[0];
  if (candidateHostname === "localhost" || candidateHostname === "127.0.0.1") return true;

  return false;
}
