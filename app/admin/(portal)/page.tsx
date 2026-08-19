import { ExternalLink, Wrench } from "lucide-react";
import Link from "next/link";

import { getAdminSession } from "@/lib/admin/auth";
import { SESSION_TTL_SECONDS } from "@/lib/admin/session";

export const metadata = { title: "Dashboard" };

/**
 * The portal's landing page.
 *
 * Intentionally close to empty: the login, the session and the shell are what
 * exist so far, and the content-management sections land on top of this later.
 * Showing a real (if small) surface beats a stub that pretends to manage
 * things it cannot.
 */
export default async function DashboardPage() {
  const session = await getAdminSession();
  const hours = Math.round(SESSION_TTL_SECONDS / 3600);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-charcoal">
          You&apos;re signed in
        </h1>
        <p className="mt-2 text-[15px] text-charcoal/60">
          Signed in as {session?.email}. Sessions last {hours} hours, then you&apos;ll be asked
          to sign in again.
        </p>
      </div>

      <div className="rounded-card border border-dashed border-silver bg-white/60 p-7">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-sage text-deep-teal">
          <Wrench className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="mt-4 font-heading text-xl font-bold text-charcoal">
          Nothing to manage here yet
        </h2>
        <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-charcoal/65">
          This is the shell the content-management sections will sit in. Until they land,
          everything on the site is still edited in the repo — page copy in{" "}
          <code className="rounded bg-sage/60 px-1.5 py-0.5 text-[13px]">
            content/site-content.json
          </code>
          , posts in <code className="rounded bg-sage/60 px-1.5 py-0.5 text-[13px]">content/blog</code>.
        </p>
      </div>

      <div>
        <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-charcoal/50">
          Shortcuts
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Link
            href="/"
            className="group flex items-center justify-between gap-3 rounded-2xl border border-silver/70 bg-white px-5 py-4 transition-colors hover:border-deep-teal"
          >
            <span>
              <span className="block text-[15px] font-semibold text-charcoal">
                View the live site
              </span>
              <span className="block text-sm text-charcoal/55">
                Opens the public homepage
              </span>
            </span>
            <ExternalLink
              className="h-4 w-4 shrink-0 text-deep-teal"
              aria-hidden="true"
            />
          </Link>

          <Link
            href="/contact"
            className="group flex items-center justify-between gap-3 rounded-2xl border border-silver/70 bg-white px-5 py-4 transition-colors hover:border-deep-teal"
          >
            <span>
              <span className="block text-[15px] font-semibold text-charcoal">
                Contact page
              </span>
              <span className="block text-sm text-charcoal/55">
                Check what enquiries look like
              </span>
            </span>
            <ExternalLink
              className="h-4 w-4 shrink-0 text-deep-teal"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
