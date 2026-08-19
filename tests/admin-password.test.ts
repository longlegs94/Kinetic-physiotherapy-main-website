import { describe, expect, it } from "vitest";

import {
  adminUsers,
  findAdminUser,
  hashPassword,
  parseAdminUsers,
  verifyPassword,
} from "@/lib/admin/password";

// scrypt at the configured cost takes ~100ms per call, and several cases hash
// more than once.
const HASH_TIMEOUT = 20_000;

describe("hashPassword / verifyPassword", () => {
  it(
    "accepts the right password and rejects a wrong one",
    async () => {
      const hash = await hashPassword("correct horse battery staple");
      expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
      expect(await verifyPassword("Correct horse battery staple", hash)).toBe(false);
      expect(await verifyPassword("", hash)).toBe(false);
    },
    HASH_TIMEOUT
  );

  it(
    "salts each hash, so the same password hashes differently every time",
    async () => {
      const [a, b] = await Promise.all([hashPassword("same-password"), hashPassword("same-password")]);
      expect(a).not.toBe(b);
      expect(await verifyPassword("same-password", a)).toBe(true);
      expect(await verifyPassword("same-password", b)).toBe(true);
    },
    HASH_TIMEOUT
  );

  it(
    "encodes the cost parameters into the hash so they can be raised later",
    async () => {
      const hash = await hashPassword("whatever-goes-here");
      const [scheme, N, r, p] = hash.split("$");
      expect(scheme).toBe("scrypt");
      expect(Number(N)).toBeGreaterThanOrEqual(2 ** 14);
      expect(Number(r)).toBeGreaterThan(0);
      expect(Number(p)).toBeGreaterThan(0);
    },
    HASH_TIMEOUT
  );

  it(
    "normalises unicode, so a password typed on a different keyboard still matches",
    async () => {
      // U+00E9 and "e" + U+0301 render identically; without NFKC the second
      // spelling would be a failed login nobody could explain.
      const hash = await hashPassword("café-password");
      expect(await verifyPassword("café-password", hash)).toBe(true);
    },
    HASH_TIMEOUT
  );

  it("returns false rather than throwing on a malformed hash", async () => {
    // A half-pasted or corrupted environment variable must fail closed.
    for (const bad of [
      "",
      "not-a-hash",
      "scrypt$32768$8$1$onlyfourparts",
      "bcrypt$32768$8$1$c2FsdA$a2V5",
      "scrypt$abc$8$1$c2FsdA$a2V5",
      "scrypt$32768$8$1$$a2V5",
      "scrypt$32768$8$1$c2FsdA$",
    ]) {
      expect(await verifyPassword("anything", bad)).toBe(false);
    }
  });

  it("refuses absurd cost parameters instead of trying to honour them", async () => {
    // A hostile ADMIN_USERS value shouldn't be able to turn a login attempt
    // into a memory-exhaustion request.
    expect(await verifyPassword("anything", "scrypt$1099511627776$8$1$c2FsdA$a2V5")).toBe(false);
    expect(await verifyPassword("anything", "scrypt$32768$99999$1$c2FsdA$a2V5")).toBe(false);
  });
});

describe("parseAdminUsers", () => {
  // A real hash, so entries survive the format check. Password is "test-password-1".
  const hash =
    "scrypt$32768$8$1$Jt5wmyqctJ06PzRgO4wXbA$sGqd2cLsQKF7E0SVZqXcGwz8RDY_ANZnZb78ItCdAp8";

  it("returns nothing when unset or empty", () => {
    expect(parseAdminUsers(undefined)).toEqual([]);
    expect(parseAdminUsers("")).toEqual([]);
    expect(parseAdminUsers("   ")).toEqual([]);
  });

  it("parses a single entry", () => {
    expect(parseAdminUsers(`owner@example.com:${hash}`)).toEqual([
      { email: "owner@example.com", passwordHash: hash },
    ]);
  });

  it.each([
    ["newlines", "\n"],
    ["commas", ","],
    ["semicolons", ";"],
  ])("separates entries on %s", (_label, separator) => {
    const raw = `a@example.com:${hash}${separator}b@example.com:${hash}`;
    expect(parseAdminUsers(raw).map((u) => u.email)).toEqual(["a@example.com", "b@example.com"]);
  });

  it("lower-cases emails so capitalisation can't lock someone out", () => {
    expect(parseAdminUsers(`Owner@Example.COM:${hash}`)[0].email).toBe("owner@example.com");
  });

  it("splits on the first colon only, leaving the hash intact", () => {
    // The hash contains "$" separators but no colon, so this is unambiguous —
    // the test pins it because splitting on every colon would corrupt it.
    expect(parseAdminUsers(`owner@example.com:${hash}`)[0].passwordHash).toBe(hash);
  });

  it("drops entries that aren't usable", () => {
    expect(
      parseAdminUsers(
        [
          "no-at-sign:" + hash,
          "missing-hash@example.com:",
          "missing-hash@example.com",
          ":" + hash,
          "garbage@example.com:not-a-real-hash",
        ].join("\n")
      )
    ).toEqual([]);
  });

  it("keeps the last entry when an email is listed twice", () => {
    // Someone re-pasting a list after rotating a password expects the new hash
    // to win, not to be shadowed by the stale one above it.
    const rotated = hash.replace("sGqd", "tGqd");
    const parsed = parseAdminUsers(`owner@example.com:${hash}\nowner@example.com:${rotated}`);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].passwordHash).toBe(rotated);
  });

  it("ignores blank entries and surrounding whitespace", () => {
    expect(parseAdminUsers(`\n  owner@example.com:${hash}  \n\n`)).toHaveLength(1);
  });
});

describe("findAdminUser", () => {
  const hash =
    "scrypt$32768$8$1$Jt5wmyqctJ06PzRgO4wXbA$sGqd2cLsQKF7E0SVZqXcGwz8RDY_ANZnZb78ItCdAp8";
  const env = { ADMIN_USERS: `owner@example.com:${hash}` };

  it("matches regardless of case or surrounding whitespace", () => {
    expect(findAdminUser("  OWNER@example.com ", env)?.email).toBe("owner@example.com");
  });

  it("returns null for an unknown email", () => {
    expect(findAdminUser("someone-else@example.com", env)).toBeNull();
  });

  it("reports no accounts when ADMIN_USERS is unset", () => {
    expect(adminUsers({})).toEqual([]);
    expect(findAdminUser("owner@example.com", {})).toBeNull();
  });
});
