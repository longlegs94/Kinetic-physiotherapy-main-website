import { describe, expect, it } from "vitest";

import { isSafeRedirect } from "@/lib/admin/auth";
import type { AdminEnv } from "@/lib/admin/password";
import {
  SESSION_TTL_SECONDS,
  collectAdminEnvProblems,
  createSessionToken,
  sessionCookieOptions,
  sessionSecretConfigured,
  verifySessionToken,
} from "@/lib/admin/session";

const HASH =
  "scrypt$32768$8$1$Jt5wmyqctJ06PzRgO4wXbA$sGqd2cLsQKF7E0SVZqXcGwz8RDY_ANZnZb78ItCdAp8";
const SECRET = "a".repeat(48);

function envWith(overrides: Partial<AdminEnv> = {}): AdminEnv {
  return {
    ADMIN_SESSION_SECRET: SECRET,
    ADMIN_USERS: `owner@example.com:${HASH}`,
    ...overrides,
  };
}

describe("secret configuration", () => {
  it("treats a short secret as unconfigured", () => {
    // Mirrors lib/message-auth.ts: a trivially short secret invites a false
    // sense of protection, so it is refused rather than used.
    expect(sessionSecretConfigured(envWith({ ADMIN_SESSION_SECRET: "tooshort" }))).toBe(false);
    expect(sessionSecretConfigured(envWith({ ADMIN_SESSION_SECRET: "b".repeat(31) }))).toBe(false);
    expect(sessionSecretConfigured(envWith({ ADMIN_SESSION_SECRET: "b".repeat(32) }))).toBe(true);
  });

  it("issues no token without a usable secret", () => {
    // An unsigned token would be trivially forgeable, so issuing nothing is
    // the only safe response.
    expect(createSessionToken("owner@example.com", HASH, envWith({ ADMIN_SESSION_SECRET: "" }))).toBeNull();
  });
});

describe("round trip", () => {
  it("verifies a token it just issued", () => {
    const env = envWith();
    const token = createSessionToken("owner@example.com", HASH, env);
    expect(token).not.toBeNull();
    expect(verifySessionToken(token, env)?.email).toBe("owner@example.com");
  });

  it("normalises the email it stores", () => {
    const env = envWith();
    const token = createSessionToken("  OWNER@Example.com  ", HASH, env);
    expect(verifySessionToken(token, env)?.email).toBe("owner@example.com");
  });

  it("reports when the session expires", () => {
    const env = envWith();
    const now = 1_700_000_000_000;
    const token = createSessionToken("owner@example.com", HASH, env, now);
    expect(verifySessionToken(token, env, now)?.expiresAt).toBe(now + SESSION_TTL_SECONDS * 1000);
  });
});

describe("rejection", () => {
  it("rejects an absent or malformed token", () => {
    const env = envWith();
    for (const bad of [undefined, null, "", "no-separator", ".", ".sig", "payload."]) {
      expect(verifySessionToken(bad, env)).toBeNull();
    }
  });

  it("rejects a tampered payload", () => {
    // The whole point of the signature: the browser holds the cookie, so it
    // can edit it, and must not be able to promote itself by doing so.
    const env = envWith({ ADMIN_USERS: `owner@example.com:${HASH},other@example.com:${HASH}` });
    const token = createSessionToken("other@example.com", HASH, env)!;
    const forged =
      Buffer.from(JSON.stringify({ sub: "owner@example.com", pv: "x", exp: 9_999_999_999 })).toString(
        "base64url"
      ) + token.slice(token.indexOf("."));
    expect(verifySessionToken(forged, env)).toBeNull();
  });

  it("rejects a token signed with a different secret", () => {
    const token = createSessionToken("owner@example.com", HASH, envWith())!;
    // Rotating ADMIN_SESSION_SECRET is the blunt "sign everyone out" lever.
    expect(verifySessionToken(token, envWith({ ADMIN_SESSION_SECRET: "z".repeat(48) }))).toBeNull();
  });

  it("rejects an expired token", () => {
    const env = envWith();
    const now = 1_700_000_000_000;
    const token = createSessionToken("owner@example.com", HASH, env, now);
    expect(verifySessionToken(token, env, now + SESSION_TTL_SECONDS * 1000 + 1)).toBeNull();
  });

  it("rejects a session for an account that has been removed", () => {
    // Deleting someone from ADMIN_USERS has to sign them out now, not
    // whenever their cookie happens to lapse.
    const token = createSessionToken("owner@example.com", HASH, envWith())!;
    expect(verifySessionToken(token, envWith({ ADMIN_USERS: "" }))).toBeNull();
  });

  it("rejects a session issued against a since-changed password", () => {
    // A stolen cookie must die when the password it was issued against is
    // rotated — otherwise rotating it accomplishes nothing for the attacker
    // who already has a session.
    const token = createSessionToken("owner@example.com", HASH, envWith())!;
    const rotated = HASH.replace("sGqd", "tGqd");
    expect(verifySessionToken(token, envWith({ ADMIN_USERS: `owner@example.com:${rotated}` }))).toBeNull();
  });
});

describe("cookie options", () => {
  it("is httpOnly and same-site in both runtimes", () => {
    for (const isProduction of [true, false]) {
      const options = sessionCookieOptions(isProduction, SESSION_TTL_SECONDS);
      expect(options.httpOnly).toBe(true);
      expect(options.sameSite).toBe("lax");
      expect(options.path).toBe("/");
    }
  });

  it("only marks the cookie secure in production", () => {
    // A secure cookie is dropped over plain HTTP, so hard-coding it true would
    // make signing in on http://localhost silently impossible.
    expect(sessionCookieOptions(true, 60).secure).toBe(true);
    expect(sessionCookieOptions(false, 60).secure).toBe(false);
  });
});

describe("collectAdminEnvProblems", () => {
  it("is silent when the portal is switched off entirely", () => {
    // The default for this repo. The public site doesn't depend on the portal,
    // so an absent portal is not a misconfiguration.
    expect(collectAdminEnvProblems({})).toEqual([]);
  });

  it("passes a fully configured portal", () => {
    expect(collectAdminEnvProblems(envWith())).toEqual([]);
  });

  it("flags accounts with no signing secret", () => {
    // This combination rejects every correct password, which reads as a
    // forgotten password rather than a missing setting.
    const problems = collectAdminEnvProblems(
      envWith({ ADMIN_SESSION_SECRET: undefined })
    );
    expect(problems.map((p) => p.variable)).toContain("ADMIN_SESSION_SECRET");
  });

  it("flags a signing secret that is too short to be used", () => {
    const problems = collectAdminEnvProblems(envWith({ ADMIN_SESSION_SECRET: "short" }));
    expect(problems[0].variable).toBe("ADMIN_SESSION_SECRET");
    expect(problems[0].problem).toMatch(/32 characters/);
  });

  it("flags a secret with nobody to sign in", () => {
    const problems = collectAdminEnvProblems(envWith({ ADMIN_USERS: undefined }));
    expect(problems.map((p) => p.variable)).toContain("ADMIN_USERS");
  });

  it("flags an ADMIN_USERS value that parses to nothing", () => {
    const problems = collectAdminEnvProblems(envWith({ ADMIN_USERS: "owner@example.com:oops" }));
    expect(problems.map((p) => p.variable)).toContain("ADMIN_USERS");
  });
});

describe("isSafeRedirect", () => {
  it("allows paths inside the portal", () => {
    expect(isSafeRedirect("/admin")).toBe(true);
    expect(isSafeRedirect("/admin/")).toBe(true);
    expect(isSafeRedirect("/admin/settings")).toBe(true);
    expect(isSafeRedirect("/admin?tab=content")).toBe(true);
  });

  it("rejects protocol-relative URLs that would leave the site", () => {
    // Both of these are resolved to another origin by browsers, so a
    // leading-slash test alone would make the login page an open redirect.
    expect(isSafeRedirect("//evil.example")).toBe(false);
    expect(isSafeRedirect("/\\evil.example")).toBe(false);
  });

  it("rejects anything outside the portal", () => {
    expect(isSafeRedirect("https://evil.example")).toBe(false);
    expect(isSafeRedirect("/contact")).toBe(false);
    expect(isSafeRedirect("")).toBe(false);
    // Matching the whole segment, not just the six-character prefix.
    expect(isSafeRedirect("/administrator")).toBe(false);
    expect(isSafeRedirect("/adminfoo")).toBe(false);
  });
});
