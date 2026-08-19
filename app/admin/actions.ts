"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { adminPortalConfigured, getAdminSession, isSafeRedirect } from "@/lib/admin/auth";
import { findAdminUser, verifyPassword } from "@/lib/admin/password";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/admin/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { isProductionRuntime } from "@/lib/request";

/**
 * Sign-in and sign-out for the staff portal.
 *
 * These are Server Actions rather than route handlers so the login form works
 * without JavaScript and so the session cookie can be set in the same
 * roundtrip that renders the next screen. Next compares Origin against Host on
 * every action invocation, which is the same CSRF check lib/request.ts applies
 * by hand to the public API routes.
 */

export type LoginState = { error: string | null };

/** Deliberately identical for "no such account" and "wrong password". Telling
 *  the two apart turns the form into an account-enumeration oracle. */
const INVALID_CREDENTIALS = "That email and password don't match an account.";

/**
 * Login attempts are limited per IP. The window is generous enough for someone
 * mistyping a password and far too tight for guessing one — scrypt already
 * makes each attempt expensive, this makes a serial online attack pointless.
 */
const LOGIN_LIMIT = { limit: 8, windowMs: 10 * 60 * 1000 };

/**
 * A well-formed hash of a random string that no one holds the password to.
 * Verifying against it costs the same scrypt work as verifying a real account,
 * which is what stops an unknown email from answering faster than a known one
 * and turning response time into an account-enumeration oracle.
 */
const DUMMY_HASH =
  "scrypt$32768$8$1$Jt5wmyqctJ06PzRgO4wXbA$sGqd2cLsQKF7E0SVZqXcGwz8RDY_ANZnZb78ItCdAp8";

function clientIp(headerList: Headers): string {
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  return headerList.get("x-real-ip")?.trim().slice(0, 64) ?? "unknown";
}

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const requestedNext = String(formData.get("next") ?? "");

  if (!email || !password) {
    return { error: "Enter both your email and your password." };
  }

  // Say so plainly rather than rejecting a correct password: on a deployment
  // that has never set ADMIN_USERS there is no password that would work, and
  // "invalid credentials" would send someone hunting for a typo instead of a
  // missing environment variable.
  if (!adminPortalConfigured()) {
    return {
      error:
        "The portal isn't set up on this deployment yet — ADMIN_USERS and ADMIN_SESSION_SECRET need to be configured.",
    };
  }

  const headerList = await headers();
  const limit = await checkRateLimit(`admin-login:${clientIp(headerList)}`, LOGIN_LIMIT);
  if (!limit.allowed) {
    const minutes = Math.max(1, Math.ceil(limit.retryAfterSeconds / 60));
    return {
      error: `Too many sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }

  const user = findAdminUser(email);
  if (!user) {
    await verifyPassword(password, DUMMY_HASH);
    return { error: INVALID_CREDENTIALS };
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    return { error: INVALID_CREDENTIALS };
  }

  const token = createSessionToken(user.email, user.passwordHash);
  if (!token) {
    return { error: "Couldn't start a session. ADMIN_SESSION_SECRET is missing or too short." };
  }

  const store = await cookies();
  store.set(
    SESSION_COOKIE,
    token,
    sessionCookieOptions(isProductionRuntime(), SESSION_TTL_SECONDS)
  );

  redirect(isSafeRedirect(requestedNext) ? requestedNext : "/admin");
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/admin/login");
}

/** Exposed so the header can greet whoever is signed in without every caller
 *  reaching into the DAL. */
export async function currentAdminEmail(): Promise<string | null> {
  return (await getAdminSession())?.email ?? null;
}
