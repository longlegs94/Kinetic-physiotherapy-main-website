import Link from "next/link";
import { AlertCircle, Clock, Eye } from "lucide-react";

/**
 * The banners that explain *why* the portal is behaving the way it is.
 *
 * The commit-and-rebuild model has one property that will otherwise confuse
 * everyone who uses it: a saved change is not on the website yet. Nothing is
 * broken, the deploy is just still running. Saying so plainly, every time, is
 * cheaper than fielding the question.
 */

export function DeployPendingNotice() {
  return (
    <p className="flex items-start gap-2.5 rounded-2xl border border-deep-teal/25 bg-sage/40 px-4 py-3 text-sm text-charcoal">
      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-deep-teal" aria-hidden="true" />
      <span>
        Saved changes take about a minute to appear on the public website while it rebuilds.
        You can close this page — the change is recorded either way.
      </span>
    </p>
  );
}

export function ReadOnlyNotice() {
  return (
    <p className="flex items-start gap-2.5 rounded-2xl border border-cta-orange/40 bg-cta-orange/10 px-4 py-3 text-sm text-charcoal">
      <Eye className="mt-0.5 h-4 w-4 shrink-0 text-cta-orange" aria-hidden="true" />
      <span>
        <strong className="font-semibold">View only.</strong> Saving isn&apos;t set up on this
        deployment — <code className="font-semibold">CONTENT_GITHUB_TOKEN</code> and{" "}
        <code className="font-semibold">CONTENT_GITHUB_REPO</code> need to be configured. You can
        still see everything the website currently says.
      </span>
    </p>
  );
}

export function LoadErrorNotice({ message }: { message: string }) {
  return (
    <p
      className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      role="alert"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        {message} Showing the version from the last website build, which may be out of date —
        saving is disabled until this is resolved.
      </span>
    </p>
  );
}

export function Breadcrumb({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-sm font-semibold text-deep-teal underline-offset-4 hover:underline"
    >
      ← {label}
    </Link>
  );
}
