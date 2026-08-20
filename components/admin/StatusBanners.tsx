import Link from "next/link";
import { AlertCircle, Clock, Eye } from "lucide-react";

/**
 * The banners that explain *why* the portal is behaving the way it is.
 *
 * Saving is immediate, which is worth stating: someone who has used a website
 * editor before will expect a "publish" step, and will go looking for one.
 */

export function DeployPendingNotice() {
  return (
    <p className="flex items-start gap-2.5 rounded-2xl border border-deep-teal/25 bg-sage/40 px-4 py-3 text-sm text-charcoal">
      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-deep-teal" aria-hidden="true" />
      <span>
        Changes go live on the website as soon as you save — there&apos;s no separate publish
        step. Every change is recorded with your name against it.
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
        deployment — the database&apos;s{" "}
        <code className="font-semibold">SUPABASE_SERVICE_ROLE_KEY</code> needs to be configured.
        You can still see everything the website currently says.
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
      <span>{message}</span>
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
