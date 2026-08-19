import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifySessionToken } from "@/lib/admin/session";

/**
 * Bounces signed-out visitors away from the staff portal before a page
 * renders.
 *
 * This is the optimistic check the Next.js auth guide describes: it reads the
 * session cookie and nothing else, so it stays cheap enough to run on every
 * matched request. It is *not* the security boundary — `requireAdmin()` in
 * `app/admin/(portal)/layout.tsx` is, and it runs regardless of what this file
 * does or whether the matcher below still covers a future route.
 *
 * The matcher is scoped to `/admin` rather than the whole site on purpose.
 * Every other route here is statically prerendered and served from the CDN;
 * putting a proxy hop in front of them would buy nothing and cost a function
 * invocation per request.
 *
 * `middleware.ts` is the old name for this file — Next 16 renamed the
 * convention to `proxy.ts` and the exported function to `proxy`.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // The login screen has to stay reachable without a session, or there is no
  // way to get one.
  if (pathname === "/admin/login") return NextResponse.next();

  const session = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (session) return NextResponse.next();

  // Carry the requested path so signing in lands where the visitor was going.
  const loginUrl = new URL("/admin/login", request.nextUrl);
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
