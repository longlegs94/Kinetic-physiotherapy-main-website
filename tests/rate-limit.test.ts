import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { __resetInMemoryRateLimit, checkRateLimit, rateLimitBackend } from "@/lib/rate-limit";

const UPSTASH_ENV = ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of UPSTASH_ENV) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
  __resetInMemoryRateLimit();
});

afterEach(() => {
  for (const key of UPSTASH_ENV) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
  vi.unstubAllGlobals();
});

describe("backend selection", () => {
  it("uses memory when Upstash is not configured", () => {
    expect(rateLimitBackend()).toBe("memory");
  });

  it("uses Upstash when both variables are set", () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    expect(rateLimitBackend()).toBe("upstash");
  });

  it("stays on memory when only one variable is set", () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    expect(rateLimitBackend()).toBe("memory");
  });
});

describe("in-memory limiting", () => {
  it("allows up to the limit then blocks", async () => {
    const opts = { limit: 3, windowMs: 60_000 };
    for (let i = 0; i < 3; i++) {
      expect((await checkRateLimit("k", opts)).allowed, `call ${i + 1}`).toBe(true);
    }
    const blocked = await checkRateLimit("k", opts);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("keys are independent", async () => {
    const opts = { limit: 1, windowMs: 60_000 };
    expect((await checkRateLimit("a", opts)).allowed).toBe(true);
    expect((await checkRateLimit("b", opts)).allowed).toBe(true);
    expect((await checkRateLimit("a", opts)).allowed).toBe(false);
  });

  it("recovers once the window passes", async () => {
    vi.useFakeTimers();
    try {
      const opts = { limit: 1, windowMs: 1_000 };
      expect((await checkRateLimit("k", opts)).allowed).toBe(true);
      expect((await checkRateLimit("k", opts)).allowed).toBe(false);
      vi.advanceTimersByTime(1_500);
      expect((await checkRateLimit("k", opts)).allowed).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("Upstash backend", () => {
  beforeEach(() => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
  });

  function stubPipeline(count: number) {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify([{ result: count }, { result: 1 }]), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("allows while the atomic counter is within the limit", async () => {
    stubPipeline(3);
    expect((await checkRateLimit("k", { limit: 5, windowMs: 60_000 })).allowed).toBe(true);
  });

  it("blocks once the counter exceeds the limit", async () => {
    stubPipeline(6);
    const result = await checkRateLimit("k", { limit: 5, windowMs: 60_000 });
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("allows exactly at the limit", async () => {
    stubPipeline(5);
    expect((await checkRateLimit("k", { limit: 5, windowMs: 60_000 })).allowed).toBe(true);
  });

  it("counts with a single atomic INCR rather than read-then-write", async () => {
    const fetchMock = stubPipeline(1);
    await checkRateLimit("k", { limit: 5, windowMs: 60_000 });
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body[0][0]).toBe("INCR");
    expect(body[1][0]).toBe("EXPIRE");
  });

  it("fails closed when the shared store is unreachable", async () => {
    // Falling back to in-memory here would let an attacker disable shared
    // limiting by making Redis unreachable.
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network down"); }));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await checkRateLimit("k", { limit: 5, windowMs: 60_000 })).allowed).toBe(false);
  });

  it("fails closed on a non-OK response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 500 })));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await checkRateLimit("k", { limit: 5, windowMs: 60_000 })).allowed).toBe(false);
  });

  it("does not log the key, which contains a client IP", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network down"); }));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await checkRateLimit("contact:min:203.0.113.42", { limit: 5, windowMs: 60_000 });
    const logged = errorSpy.mock.calls.flat().join(" ");
    expect(logged).not.toContain("203.0.113.42");
  });
});
