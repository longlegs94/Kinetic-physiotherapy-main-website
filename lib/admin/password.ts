import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Password hashing and the admin account list.
 *
 * There is no database on this site — content is JSON in the repo — so admin
 * accounts live in the `ADMIN_USERS` environment variable, one `email:hash`
 * pair per entry. That is a deliberate trade: adding or removing a staff login
 * costs a redeploy, but it keeps the portal free of a datastore, a migration
 * story and a password-reset flow that nobody is on hand to operate.
 *
 * Only hashes are ever stored. `ADMIN_USERS` is server-side (never
 * NEXT_PUBLIC_), but a Vercel environment variable is visible to everyone with
 * project access, so a plaintext password there would leak to more people than
 * intended. Generate the hash with `npm run admin:hash` and paste that.
 *
 * scrypt comes from node:crypto rather than bcrypt/argon2 so the portal adds
 * no native dependency to a project that currently has none.
 */

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number }
) => Promise<Buffer>;

/**
 * Cost parameters. N=2^15 with r=8 needs 128 * N * r = 32 MiB of memory per
 * hash and lands around 100ms on Vercel's hardware — slow enough to make
 * offline cracking expensive, fast enough that a login doesn't feel stalled.
 *
 * `maxmem` has to be raised explicitly: Node defaults to a 32 MiB ceiling,
 * which these parameters sit exactly on top of, and scrypt throws rather than
 * degrading when it is exceeded.
 */
const COST = { N: 2 ** 15, r: 8, p: 1, maxmem: 96 * 1024 * 1024 } as const;
const KEY_BYTES = 32;
const SALT_BYTES = 16;

/**
 * Hashes a password into the `scrypt$N$r$p$salt$key` form stored in
 * `ADMIN_USERS`. The cost parameters travel inside the string so they can be
 * raised later without invalidating hashes generated today.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await scrypt(password.normalize("NFKC"), salt, KEY_BYTES, COST);
  return [
    "scrypt",
    COST.N,
    COST.r,
    COST.p,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join("$");
}

type ParsedHash = { N: number; r: number; p: number; salt: Buffer; key: Buffer };

/** Parses a stored hash. Returns null for anything malformed — a corrupted or
 *  half-pasted environment variable must fail closed, not throw at request
 *  time. */
function parseHash(encoded: string): ParsedHash | null {
  const parts = encoded.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return null;

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  // Reject absurd parameters rather than letting a hostile value turn a login
  // attempt into a memory-exhaustion request.
  if (!Number.isInteger(N) || N < 2 || N > 2 ** 20) return null;
  if (!Number.isInteger(r) || r < 1 || r > 32) return null;
  if (!Number.isInteger(p) || p < 1 || p > 16) return null;

  const salt = Buffer.from(parts[4], "base64url");
  const key = Buffer.from(parts[5], "base64url");
  if (salt.length === 0 || key.length === 0) return null;

  return { N, r, p, salt, key };
}

/**
 * Checks a password against a stored hash. Never throws: every failure path —
 * malformed hash, wrong password, scrypt refusing the parameters — returns
 * false, because the caller's only safe interpretation of an error is "not
 * authenticated".
 */
export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const parsed = parseHash(encoded);
  if (!parsed) return false;

  try {
    const derived = await scrypt(password.normalize("NFKC"), parsed.salt, parsed.key.length, {
      N: parsed.N,
      r: parsed.r,
      p: parsed.p,
      maxmem: COST.maxmem,
    });
    // Lengths already match by construction, but timingSafeEqual throws on a
    // mismatch, so guard it.
    if (derived.length !== parsed.key.length) return false;
    return timingSafeEqual(derived, parsed.key);
  } catch {
    return false;
  }
}

export type AdminUser = { email: string; passwordHash: string };

/**
 * The slice of the environment the portal reads. Indexed rather than a closed
 * object type so `process.env` satisfies it, while tests can pass a plain
 * object with just these keys — the same shape `RequestEnv` and `AiEnv` use.
 */
export type AdminEnv = {
  ADMIN_USERS?: string;
  ADMIN_SESSION_SECRET?: string;
  [key: string]: string | undefined;
};

/**
 * Parses `ADMIN_USERS` into accounts.
 *
 * Entries are separated by newlines, commas or semicolons — whichever the
 * person filling in the Vercel settings box reaches for — and each entry is
 * `email:hash`. Splitting on the *first* colon is safe because a scrypt hash
 * contains none. Emails are lower-cased so a login isn't rejected over
 * capitalisation.
 */
export function parseAdminUsers(raw: string | undefined): AdminUser[] {
  if (!raw?.trim()) return [];

  const users = new Map<string, AdminUser>();
  for (const entry of raw.split(/[\n,;]+/)) {
    const trimmed = entry.trim();
    if (!trimmed) continue;

    const separator = trimmed.indexOf(":");
    if (separator <= 0) continue;

    const email = trimmed.slice(0, separator).trim().toLowerCase();
    const passwordHash = trimmed.slice(separator + 1).trim();
    if (!email.includes("@") || !parseHash(passwordHash)) continue;

    // Last entry wins, so a re-pasted list with a rotated hash behaves the way
    // whoever edited it expects.
    users.set(email, { email, passwordHash });
  }

  return [...users.values()];
}

/** The configured admin accounts. Empty when `ADMIN_USERS` is unset, which is
 *  what makes the portal report itself unconfigured instead of open. */
export function adminUsers(env: AdminEnv = process.env): AdminUser[] {
  return parseAdminUsers(env.ADMIN_USERS);
}

/** Looks up an account by email, case-insensitively. */
export function findAdminUser(
  email: string,
  env: AdminEnv = process.env
): AdminUser | null {
  const wanted = email.trim().toLowerCase();
  return adminUsers(env).find((user) => user.email === wanted) ?? null;
}
