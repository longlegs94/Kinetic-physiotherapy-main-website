import { describe, expect, it } from "vitest";

import {
  MAX_BODY_BYTES,
  allowedOriginHosts,
  getClientIp,
  isAllowedOrigin,
  isAllowedOriginValue,
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
    expect(isAllowedOriginValue("https://www.kinetictherapyclinic.ca", null, PROD)).toBe(true);
  });

  it("denies a missing Origin header", () => {
    // Browsers always send Origin on POST, so its absence is not a form post.
    expect(isAllowedOriginValue(null, null, PROD)).toBe(false);
  });

  it("denies localhost", () => {
    // The regression this guards: localhost used to be unconditionally
    // allowed, and Origin is trivially settable by a non-browser client.
    expect(isAllowedOriginValue("http://localhost:3000", null, PROD)).toBe(false);
    expect(isAllowedOriginValue("http://127.0.0.1", null, PROD)).toBe(false);
  });

  it("denies an unrelated origin", () => {
    expect(isAllowedOriginValue("https://evil.example.com", null, PROD)).toBe(false);
  });

  it("denies a lookalike subdomain", () => {
    expect(isAllowedOriginValue("https://www.kinetictherapyclinic.ca.evil.com", null, PROD)).toBe(false);
  });

  it("denies a malformed Origin", () => {
    expect(isAllowedOriginValue("not a url", null, PROD)).toBe(false);
  });

  it("denies everything when NEXT_PUBLIC_SITE_URL is unset", () => {
    // Previously an unset site URL disabled the check entirely.
    expect(isAllowedOriginValue("https://evil.example.com", null, { VERCEL_ENV: "production" })).toBe(false);
  });

  it("allows the deploy's own Vercel hostname", () => {
    expect(
      isAllowedOriginValue("https://kinetic-abc123.vercel.app", null, {
        ...PROD,
        VERCEL_URL: "kinetic-abc123.vercel.app",
      })
    ).toBe(true);
  });
});

describe("isAllowedOrigin outside production", () => {
  it("stays permissive in development", () => {
    const dev = { NODE_ENV: "development" };
    expect(isAllowedOriginValue(null, null, dev)).toBe(true);
    expect(isAllowedOriginValue("http://localhost:3000", null, dev)).toBe(true);
  });

  it("allows any preview deployment hostname", () => {
    const preview = { VERCEL_ENV: "preview", NEXT_PUBLIC_SITE_URL: PROD.NEXT_PUBLIC_SITE_URL };
    expect(isAllowedOriginValue("https://kinetic-git-branch.vercel.app", null, preview)).toBe(true);
  });
});

describe("same-origin requests in production", () => {
  // The regression this guards, seen in production: a Vercel project answers
  // on several hostnames (project alias, team-scoped alias, per-branch alias)
  // but NEXT_PUBLIC_SITE_URL can only name one. Visiting any of the others
  // meant the browser's own same-origin POST was rejected as cross-origin, so
  // the contact form and AI assistant silently failed on those addresses.
  const otherAlias = "kinetic-physiotherapy-main-website-tau.vercel.app";

  it("allows a same-origin POST on a hostname the site answers on", () => {
    expect(isAllowedOriginValue(`https://${otherAlias}`, otherAlias, PROD)).toBe(true);
  });

  it("still allows the configured canonical host", () => {
    expect(
      isAllowedOriginValue("https://www.kinetictherapyclinic.ca", otherAlias, PROD)
    ).toBe(true);
  });

  it("still blocks a cross-origin POST, which is what the check is for", () => {
    // evil.com fetching this site: Origin is evil.com, Host is the real site.
    expect(isAllowedOriginValue("https://evil.example.com", otherAlias, PROD)).toBe(false);
  });

  it("is case-insensitive about the Host header", () => {
    expect(isAllowedOriginValue(`https://${otherAlias}`, otherAlias.toUpperCase(), PROD)).toBe(
      true
    );
  });

  it("does not treat an empty Host as a match for a malformed Origin", () => {
    expect(isAllowedOriginValue("not a url", "", PROD)).toBe(false);
  });
});

describe("isAllowedOrigin(request)", () => {
  const req = (headers: Record<string, string>) =>
    new Request("https://example.com", { method: "POST", headers });

  it("reads Origin and Host off the request", () => {
    const host = "kinetic-physiotherapy-main-website-tau.vercel.app";
    expect(isAllowedOrigin(req({ origin: `https://${host}`, host }), PROD)).toBe(true);
  });

  it("rejects a cross-origin request", () => {
    expect(
      isAllowedOrigin(
        req({ origin: "https://evil.example.com", host: "kinetic-tau.vercel.app" }),
        PROD
      )
    ).toBe(false);
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
