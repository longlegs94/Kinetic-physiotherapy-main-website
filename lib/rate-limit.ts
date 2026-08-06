/**
 * Rate limiting for the public API routes.
 *
 * Two backends, chosen at runtime:
 *
 *  - **Upstash Redis** when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 *    are set. Counting uses a single atomic INCR with an EXPIRE on first write,
 *    so concurrent requests can't interleave a read-modify-write and slip past
 *    the limit, and the counter is shared across every serverless instance.
 *  - **In-memory** otherwise, so local dev and unconfigured deploys still work.
 *
 * The in-memory path is explicitly a soft throttle: each serverless instance
 * keeps its own map, so the effective limit is (limit x warm instances). It is
 * enough to blunt casual abuse, and `rateLimitBackend()` reports which backend
 * is live so the deployment checklist can verify the real one is in use.
 *
 * Fail-closed on the shared backend: if Redis is configured but unreachable,
 * requests are rejected rather than silently falling back to per-instance
 * counting, which is what an attacker would try to induce.
 */

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

const MAX_TRACKED_KEYS = 5000;

// Module scope: persists across requests within the same server instance.
const hits = new Map<string, number[]>();

function upstashConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

export function rateLimitBackend(): "upstash" | "memory" {
  return upstashConfig() ? "upstash" : "memory";
}

/** Sliding-window-ish fixed bucket in local memory. Not shared across instances. */
function checkInMemory(key: string, opts: { limit: number; windowMs: number }): RateLimitResult {
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
  // IPs) can't grow the map unbounded — evict the oldest-inserted entries.
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
 * Atomic fixed-window counter in Redis.
 *
 * INCR returns the post-increment value, so the first caller in a window sees
 * 1 and is the one that sets the TTL. Every caller gets a distinct number from
 * a single round trip — no read-then-write window for concurrent requests to
 * exploit. Bucketing the window into the key makes expiry self-cleaning.
 */
async function checkUpstash(
  config: { url: string; token: string },
  key: string,
  opts: { limit: number; windowMs: number }
): Promise<RateLimitResult> {
  const windowSeconds = Math.ceil(opts.windowMs / 1000);
  const bucket = Math.floor(Date.now() / opts.windowMs);
  const bucketKey = `ratelimit:${key}:${bucket}`;

  // Pipeline INCR + EXPIRE in one request. EXPIRE with NX only sets the TTL
  // when the key has none, so a long-lived bucket isn't repeatedly extended.
  const res = await fetch(`${config.url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", bucketKey],
      ["EXPIRE", bucketKey, String(windowSeconds), "NX"],
    ]),
    signal: AbortSignal.timeout(2000),
  });

  if (!res.ok) {
    throw new Error(`upstash responded ${res.status}`);
  }

  const payload = (await res.json()) as { result?: unknown; error?: string }[];
  const count = Number(payload?.[0]?.result);
  if (!Number.isFinite(count)) {
    throw new Error("upstash returned a non-numeric counter");
  }

  if (count > opts.limit) {
    // Time left in the current fixed window.
    const elapsedMs = Date.now() - bucket * opts.windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((opts.windowMs - elapsedMs) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Records a hit against `key` and reports whether it is within the limit.
 *
 * Async because the shared backend is a network call. Callers must await it —
 * a forgotten await would make every request appear allowed.
 */
export async function checkRateLimit(
  key: string,
  opts: { limit: number; windowMs: number }
): Promise<RateLimitResult> {
  const config = upstashConfig();
  if (!config) {
    return checkInMemory(key, opts);
  }

  try {
    return await checkUpstash(config, key, opts);
  } catch (error) {
    // Fail closed. Falling back to in-memory here would hand an attacker a way
    // to disable shared limiting by making Redis unreachable. Log the failure
    // without the key, which contains a client IP.
    console.error(
      "Rate limit backend unavailable, rejecting request:",
      error instanceof Error ? error.message : "unknown error"
    );
    return { allowed: false, retryAfterSeconds: 30 };
  }
}

/** Test seam: clears in-memory counters between cases. */
export function __resetInMemoryRateLimit(): void {
  hits.clear();
}
