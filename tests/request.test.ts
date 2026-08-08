import { describe, expect, it } from "vitest";

import {
  MAX_BODY_BYTES,
  allowedOriginHosts,
  getClientIp,
  isAllowedOrigin,
  isProductionRuntime,
  readJsonObject,
} from "@/lib/request";

const PROD = {
  NODE_ENV: "production",
  VERCEL_ENV: "production",
  NEXT_PUBLIC_SITE_URL: "https://www.kinetictherapyclinic.ca",
};

describe("isProductionRuntime", () => {
  it("treats a Vercel production deploy as production", () => {
    expect(isProductionRuntime({ VERCEL_ENV: "production" })).toBe(true);
  });

  it("treats a Vercel preview deploy as non-production", () => {
    // Preview builds run with NODE_ENV=production, so VERCEL_ENV must win.
    expect(isProductionRuntime({ VERCEL_ENV: "preview", NODE_ENV: "production" })).toBe(false);
  });

  it("falls back to NODE_ENV off-platform", () => {
    expect(isProductionRuntime({ NODE_ENV: "production" })).toBe(true);
    expect(isProductionRuntime({ NODE_ENV: "development" })).toBe(false);
  });
});

describe("isAllowedOrigin in production", () => {
  it("allows the canonical site origin", () => {
    expect(isAllowedOrigin("https://www.kinetictherapyclinic.ca", PROD)).toBe(true);
  });

  it("denies a missing Origin header", () => {
    // Browsers always send Origin on POST, so its absence is not a form post.
    expect(isAllowedOrigin(null, PROD)).toBe(false);
  });

  it("denies localhost", () => {
    // The regression this guards: localhost used to be unconditionally
    // allowed, and Origin is trivially settable by a non-browser client.
    expect(isAllowedOrigin("http://localhost:3000", PROD)).toBe(false);
    expect(isAllowedOrigin("http://127.0.0.1", PROD)).toBe(false);
  });

  it("denies an unrelated origin", () => {
    expect(isAllowedOrigin("https://evil.example.com", PROD)).toBe(false);
  });

  it("denies a lookalike subdomain", () => {
    expect(isAllowedOrigin("https://www.kinetictherapyclinic.ca.evil.com", PROD)).toBe(false);
  });

  it("denies a malformed Origin", () => {
    expect(isAllowedOrigin("not a url", PROD)).toBe(false);
  });

  it("denies everything when NEXT_PUBLIC_SITE_URL is unset", () => {
    // Previously an unset site URL disabled the check entirely.
    expect(isAllowedOrigin("https://evil.example.com", { VERCEL_ENV: "production" })).toBe(false);
  });

  it("allows the deploy's own Vercel hostname", () => {
    expect(
      isAllowedOrigin("https://kinetic-abc123.vercel.app", {
        ...PROD,
        VERCEL_URL: "kinetic-abc123.vercel.app",
      })
    ).toBe(true);
  });
});

describe("isAllowedOrigin outside production", () => {
  it("stays permissive in development", () => {
    const dev = { NODE_ENV: "development" };
    expect(isAllowedOrigin(null, dev)).toBe(true);
    expect(isAllowedOrigin("http://localhost:3000", dev)).toBe(true);
  });

  it("allows any preview deployment hostname", () => {
    const preview = { VERCEL_ENV: "preview", NEXT_PUBLIC_SITE_URL: PROD.NEXT_PUBLIC_SITE_URL };
    expect(isAllowedOrigin("https://kinetic-git-branch.vercel.app", preview)).toBe(true);
  });
});

describe("allowedOriginHosts", () => {
  it("includes the site and the deploy hostname, de-duplicated", () => {
    const hosts = allowedOriginHosts({ ...PROD, VERCEL_URL: "kinetic-abc.vercel.app" });
    expect(hosts).toContain("www.kinetictherapyclinic.ca");
    expect(hosts).toContain("kinetic-abc.vercel.app");
    expect(new Set(hosts).size).toBe(hosts.length);
  });
});

describe("getClientIp", () => {
  const withHeaders = (headers: Record<string, string>) =>
    new Request("https://example.com", { method: "POST", headers });

  it("prefers the left-most x-forwarded-for entry", () => {
    expect(getClientIp(withHeaders({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    expect(getClientIp(withHeaders({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
  });

  it("returns a placeholder when neither header is present", () => {
    expect(getClientIp(withHeaders({}))).toBe("unknown");
  });

  it("bounds the value so a huge header cannot bloat a rate-limit key", () => {
    const ip = getClientIp(withHeaders({ "x-forwarded-for": "1".repeat(5000) }));
    expect(ip.length).toBeLessThanOrEqual(64);
  });
});

describe("readJsonObject", () => {
  const post = (body: string, headers: Record<string, string> = {}) =>
    new Request("https://example.com", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body,
    });

  it("parses a JSON object", async () => {
    const result = await readJsonObject(post(JSON.stringify({ a: 1 })));
    expect(result).toEqual({ ok: true, value: { a: 1 } });
  });

  it("rejects a body above the cap", async () => {
    const huge = JSON.stringify({ message: "x".repeat(MAX_BODY_BYTES + 100) });
    const result = await readJsonObject(post(huge));
    expect(result).toEqual({ ok: false, reason: "too_large" });
  });

  it("rejects on an oversized declared Content-Length without reading the body", async () => {
    const result = await readJsonObject(
      post(JSON.stringify({ a: 1 }), { "content-length": String(MAX_BODY_BYTES + 1) })
    );
    expect(result).toEqual({ ok: false, reason: "too_large" });
  });

  it("rejects malformed JSON", async () => {
    expect(await readJsonObject(post("{nope"))).toEqual({ ok: false, reason: "invalid_json" });
  });

  it.each([
    ["an array", "[1,2,3]"],
    ["a bare string", '"hello"'],
    ["null", "null"],
  ])("rejects %s at the top level", async (_label, payload) => {
    expect(await readJsonObject(post(payload))).toEqual({ ok: false, reason: "not_object" });
  });

  it("honours a custom cap", async () => {
    const result = await readJsonObject(post(JSON.stringify({ a: "x".repeat(100) })), 32);
    expect(result).toEqual({ ok: false, reason: "too_large" });
  });
});
