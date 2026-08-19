import { createHmac, timingSafeEqual } from "node:crypto";

import type { EnvProblem } from "../env";
import { adminUsers, findAdminUser, type AdminEnv } from "./password";

/**
 * Stateless admin sessions.
 *
 * The session is a signed cookie rather than a row in a sessions table,
 * because there is no database to put a table in. The cookie carries only what
 * the server needs to re-establish who is asking — the account's email, an
 * expiry, and a fingerprint of the password hash that was current at sign-in —
 * and an HMAC over that payload. Nothing in it is secret; the signature is
 * what makes it unforgeable.
 *
 * Two revocation levers survive the lack of server-side session storage:
 *
 *  - Removing an account from `ADMIN_USERS` invalidates its sessions, because
 *    every verification re-checks that the account still exists.
 *  - Changing an account's password invalidates its sessions, because the
 *    fingerprint baked into the token no longer matches the stored hash. A
 *    stolen cookie therefore dies when the password it was issued against is
 *    rotated, which is the whole point of rotating it.
 *
 * Rotating `ADMIN_SESSION_SECRET` invalidates every session at once.
 */

/** Eight hours — a clinic workday. Long enough not to interrupt someone
 *  mid-task, short enough that a forgotten session on a shared front-desk
 *  machine expires the same day. */
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

export const SESSION_COOKIE = "kt_admin_session";

export type AdminSession = { email: string; expiresAt: number };

/**
 * The signing key. Mirrors the rule in lib/message-auth.ts: a short secret is
 * worse than none because it invites a false sense of protection, so anything
 * under 32 characters is treated as unconfigured.
 */
function secret(env: AdminEnv = process.env): string | null {
  const value = env.ADMIN_SESSION_SECRET?.trim();
  if (!value || value.length < 32) return null;
  return value;
}

/** Whether sessions can be issued at all. The login action reports this as a
 *  configuration error rather than failing a correct password. */
export function sessionSecretConfigured(env: AdminEnv = process.env): boolean {
  return secret(env) !== null;
}

/**
 * A short, non-reversible marker for the password a session was issued
 * against. Derived through the session secret so the cookie never carries any
 * part of the stored hash itself.
 */
function passwordFingerprint(passwordHash: string, key: string): string {
  return createHmac("sha256", key).update(`pv:${passwordHash}`).digest("base64url").slice(0, 16);
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

/** Constant-time comparison that tolerates length mismatches. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

type TokenPayload = { sub: string; pv: string; exp: number };

/**
 * Issues a session token for an account. Returns null when no secret is
 * configured — an unsigned token would be trivially forgeable, so the only
 * safe response is to issue nothing.
 */
export function createSessionToken(
  email: string,
  passwordHash: string,
  env: AdminEnv = process.env,
  nowMs: number = Date.now()
): string | null {
  const key = secret(env);
  if (!key) return null;

  const payload: TokenPayload = {
    sub: email.trim().toLowerCase(),
    pv: passwordFingerprint(passwordHash, key),
    exp: Math.floor(nowMs / 1000) + SESSION_TTL_SECONDS,
  };

  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded, key)}`;
}

/**
 * Verifies a session token and returns the session it represents, or null.
 *
 * Order matters: the signature is checked before the payload is trusted for
 * anything, including the lookup. Every rejection returns null with no
 * distinction between "expired", "forged" and "account gone" — the caller has
 * the same response to all three, and a caller that can tell them apart tends
 * to leak that difference to whoever is probing.
 */
export function verifySessionToken(
  token: string | undefined | null,
  env: AdminEnv = process.env,
  nowMs: number = Date.now()
): AdminSession | null {
  const key = secret(env);
  if (!key || !token) return null;

  const separator = token.indexOf(".");
  if (separator <= 0) return null;

  const encoded = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!safeEqual(sign(encoded, key), signature)) return null;

  let payload: TokenPayload;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (typeof parsed !== "object" || parsed === null) return null;
    const candidate = parsed as Partial<TokenPayload>;
    if (
      typeof candidate.sub !== "string" ||
      typeof candidate.pv !== "string" ||
      typeof candidate.exp !== "number"
    ) {
      return null;
    }
    payload = candidate as TokenPayload;
  } catch {
    return null;
  }

  if (!Number.isFinite(payload.exp) || payload.exp * 1000 <= nowMs) return null;

  // Re-check the account against the current configuration, so removing or
  // re-hashing an account takes effect on the next request rather than
  // whenever the cookie happens to expire.
  const user = findAdminUser(payload.sub, env);
  if (!user) return null;
  if (!safeEqual(passwordFingerprint(user.passwordHash, key), payload.pv)) return null;

  return { email: user.email, expiresAt: payload.exp * 1000 };
}

/**
 * Cookie attributes for the session.
 *
 * `secure` follows the runtime rather than being hard-coded true, because a
 * secure cookie is dropped over plain HTTP and local development runs on
 * http://localhost — hard-coding it makes logging in locally silently
 * impossible. `sameSite: "lax"` keeps the cookie on the top-level navigation
 * that follows a successful login while withholding it from cross-site
 * requests.
 */
export function sessionCookieOptions(isProduction: boolean, maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/**
 * Configuration problems worth failing a production build over.
 *
 * Leaving the portal switched off entirely is fine and is the default — the
 * public site does not depend on it. What is not fine is a *half*-configured
 * portal, because both halves fail in ways that look like a forgotten
 * password rather than a missing setting: accounts with no signing secret
 * reject every correct password, and a secret with no usable accounts leaves
 * nobody able to sign in. `scripts/check-env.ts` surfaces these.
 */
export function collectAdminEnvProblems(env: AdminEnv = process.env): EnvProblem[] {
  const problems: EnvProblem[] = [];
  const rawUsers = env.ADMIN_USERS?.trim();
  const rawSecret = env.ADMIN_SESSION_SECRET?.trim();

  if (!rawUsers && !rawSecret) return problems;

  if (rawUsers && adminUsers(env).length === 0) {
    problems.push({
      variable: "ADMIN_USERS",
      problem:
        "is set but contains no usable email:hash entries — generate them with `npm run admin:hash`",
    });
  }

  if (rawUsers && !secret(env)) {
    problems.push({
      variable: "ADMIN_SESSION_SECRET",
      problem: rawSecret
        ? "must be at least 32 characters — generate with `openssl rand -base64 48`"
        : "is required whenever ADMIN_USERS is set, or no one can be issued a session",
    });
  }

  if (!rawUsers && rawSecret) {
    problems.push({
      variable: "ADMIN_USERS",
      problem: "is required whenever ADMIN_SESSION_SECRET is set, or no one can sign in",
    });
  }

  return problems;
}
