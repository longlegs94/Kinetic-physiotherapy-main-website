import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { adminUsers, type AdminEnv } from "./password";
import { SESSION_COOKIE, sessionSecretConfigured, verifySessionToken } from "./session";
import type { AdminSession } from "./session";

/**
 * The admin portal's data access layer: the one place that answers "who is
 * asking?".
 *
 * proxy.ts also checks the session, but that check is optimistic — it exists
 * to bounce signed-out visitors before a page renders, and it must never be
 * the only thing standing between a request and the portal. Every admin page,
 * action and route handler calls into this module instead, so authorization
 * lives next to the thing being protected rather than in a file that a future
 * matcher change could quietly stop applying.
 */

/**
 * Whether the portal is usable at all: at least one account, and a signing
 * secret long enough to issue sessions with. Both are required — accounts with
 * no secret cannot be given a session, and a secret with no accounts has
 * nobody to sign in.
 *
 * A deployment that has set neither is the normal state for this repo, and the
 * login page says so plainly rather than rejecting correct passwords.
 */
export function adminPortalConfigured(env: AdminEnv = process.env): boolean {
  return adminUsers(env).length > 0 && sessionSecretConfigured(env);
}

/**
 * The current session, or null. Memoized for the duration of a render pass, so
 * a layout and the page inside it don't each re-verify the same cookie.
 */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
});

/**
 * The current session, or a redirect to the login screen. Use this at the top
 * of anything that assumes a signed-in user.
 *
 * `next` carries the path the visitor was trying to reach so they land there
 * after signing in instead of on the dashboard.
 */
export async function requireAdmin(next?: string): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    const target = next && isSafeRedirect(next) ? `?next=${encodeURIComponent(next)}` : "";
    redirect(`/admin/login${target}`);
  }
  return session;
}

/**
 * Whether a post-login redirect target is one we're willing to send a browser
 * to. Only same-site paths inside the portal qualify.
 *
 * The leading-slash test alone is not enough: `//evil.example` and
 * `/\evil.example` are both protocol-relative URLs that browsers resolve to
 * another origin, which would turn the login page into an open redirect.
 */
export function isSafeRedirect(target: string): boolean {
  // `//evil.example` and `/\evil.example` are protocol-relative URLs that
  // browsers resolve to another origin, so a leading-slash test alone would
  // turn the login page into an open redirect.
  if (target.startsWith("//") || target.startsWith("/\\")) return false;
  if (target === "/admin") return true;
  // Matching the whole segment, not just the prefix, so `/administrator` and
  // `/adminfoo` don't slip through on the strength of sharing six characters.
  return target.startsWith("/admin/") || target.startsWith("/admin?");
}
