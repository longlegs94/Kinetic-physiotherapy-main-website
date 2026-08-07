import { describe, expect, it } from "vitest";

import nextConfig from "@/next.config.mjs";

const headerList = await nextConfig.headers!();
const globalHeaders = headerList.find((entry) => entry.source === "/(.*)")!.headers;

function headerValue(key: string): string {
  const found = globalHeaders.find((h) => h.key.toLowerCase() === key.toLowerCase());
  if (!found) throw new Error(`missing header: ${key}`);
  return found.value;
}

const csp = headerValue("Content-Security-Policy");

/** Reads a single directive's value out of the policy string. */
function directive(name: string): string {
  const match = csp.split("; ").find((d) => d === name || d.startsWith(`${name} `));
  if (!match) throw new Error(`missing directive: ${name}`);
  return match.slice(name.length).trim();
}

describe("CSP directives", () => {
  it("defaults to self", () => {
    expect(directive("default-src")).toBe("'self'");
  });

  it.each(["frame-src", "object-src", "frame-ancestors", "base-uri"])(
    "locks %s to none",
    (name) => {
      // Nothing in the app uses iframes, <embed>, <object> or <base>, so these
      // have no legitimate value to allow.
      expect(directive(name)).toBe("'none'");
    }
  );

  it("restricts form submissions to this origin", () => {
    expect(directive("form-action")).toBe("'self'");
  });

  it("upgrades insecure requests", () => {
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("does not allow scripts from google-analytics.com", () => {
    // GA4 serves its script from googletagmanager.com only; the wildcard is
    // needed for beacons, not for code.
    expect(directive("script-src")).not.toContain("google-analytics.com");
    expect(directive("script-src")).toContain("https://www.googletagmanager.com");
  });

  it("has no wildcard-host or scheme-wide script source", () => {
    // Compared token by token: a bare `https:` source allows every HTTPS
    // origin, whereas `https://www.googletagmanager.com` is a single host
    // that merely contains that substring.
    const sources = directive("script-src").split(/\s+/);
    expect(sources).not.toContain("https:");
    expect(sources).not.toContain("http:");
    expect(sources).not.toContain("data:");
    expect(sources).not.toContain("*");
    expect(sources.some((s) => s.startsWith("*."))).toBe(false);
  });

  it("never allows eval", () => {
    // 'unsafe-inline' is a documented trade-off for static prerendering;
    // 'unsafe-eval' is not, and must not creep in.
    expect(csp).not.toContain("unsafe-eval");
  });

  it("keeps connect-src limited to the services actually called", () => {
    const connect = directive("connect-src");
    expect(connect).toContain("https://api.web3forms.com");
    expect(connect).not.toMatch(/(^|\s)\*/);
  });
});

describe("security headers", () => {
  it("denies framing, consistently with frame-ancestors", () => {
    expect(headerValue("X-Frame-Options")).toBe("DENY");
    expect(directive("frame-ancestors")).toBe("'none'");
  });

  it("sets nosniff", () => {
    expect(headerValue("X-Content-Type-Options")).toBe("nosniff");
  });

  it("sets HSTS without preload", () => {
    // Preload submission is effectively irreversible and belongs to the site
    // owner, not to a default.
    const hsts = headerValue("Strict-Transport-Security");
    expect(hsts).toContain("max-age=");
    expect(hsts).not.toContain("preload");
  });

  it("sets cross-origin isolation headers", () => {
    expect(headerValue("Cross-Origin-Opener-Policy")).toBe("same-origin");
    expect(headerValue("Cross-Origin-Resource-Policy")).toBe("same-origin");
  });

  it("does not leak referrers cross-origin over downgrade", () => {
    expect(headerValue("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });
});
