import Link from "next/link";
import { LogOut } from "lucide-react";

import { requireAdmin } from "@/lib/admin/auth";
import { KineticMark } from "@/components/layout/Logo";

import { logout } from "../actions";

/**
 * Everything behind the login.
 *
 * `(portal)` is a route group, so `(portal)/page.tsx` is still `/admin` — the
 * group exists purely to draw a line between the pages that require a session
 * and the login screen, which cannot. Putting `requireAdmin()` here means a
 * page added under this folder is protected by default; a page that forgets to
 * check is still covered.
 *
 * This is the enforcing check. proxy.ts bounces signed-out visitors earlier,
 * but that is an optimisation, not the boundary.
 */
/** The portal's sections. Kept here so the header nav and the dashboard's
 *  cards can't drift apart as more are added. */
export const PORTAL_SECTIONS = [
  { href: "/admin/team", label: "Therapists" },
  { href: "/admin/clinic", label: "Clinic info" },
] as const;

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-silver/70 bg-white">
        <div className="mx-auto flex w-full max-w-container items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="inline-flex items-center gap-2.5 text-charcoal">
              <KineticMark className="h-7 w-7" />
              <span className="font-heading text-[15px] font-bold">Staff portal</span>
            </Link>
            <nav className="hidden items-center gap-1 sm:flex" aria-label="Portal sections">
              {PORTAL_SECTIONS.map((section) => (
                <Link
                  key={section.href}
                  href={section.href}
                  className="rounded-pill px-3 py-2 text-sm font-medium text-charcoal/70 transition-colors hover:bg-sage/60 hover:text-charcoal"
                >
                  {section.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-charcoal/60 sm:inline">{session.email}</span>
            <form action={logout}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-pill border border-charcoal/20 px-4 py-2 text-sm font-semibold text-charcoal transition-colors hover:border-deep-teal hover:bg-sage/50"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-container flex-1 px-5 py-10 sm:px-8">{children}</main>

      <footer className="border-t border-silver/70 px-5 py-5 sm:px-8">
        <div className="mx-auto flex w-full max-w-container items-center justify-between text-xs text-charcoal/45">
          <span>Kinetic Therapy Clinic</span>
          <Link href="/" className="hover:text-deep-teal">
            View the live site
          </Link>
        </div>
      </footer>
    </div>
  );
}
