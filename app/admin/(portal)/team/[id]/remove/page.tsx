import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";

import { deletePractitioner } from "@/app/admin/content-actions";
import { getPractitioner } from "@/lib/content/admin-store";
import { writeConfigured } from "@/lib/content/supabase";
import { SubmitButton } from "@/components/admin/FormFields";
import { Breadcrumb } from "@/components/admin/StatusBanners";

export const metadata = { title: "Remove therapist" };

/**
 * Confirmation step for removing someone from the team.
 *
 * A dedicated page rather than a `confirm()` dialog: removal is the one
 * destructive action in the portal, and this way the confirmation states who
 * is about to be removed, survives a mis-click, and works with JavaScript
 * unavailable — which a browser dialog would not.
 */
export default async function RemoveTherapistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!writeConfigured()) redirect("/admin/team");

  const { id } = await params;
  const person = await getPractitioner(id);
  if (!person) notFound();

  return (
    <div className="max-w-xl space-y-6">
      <Breadcrumb href={`/admin/team/${person.id}`} label={person.name} />

      <div className="rounded-card border border-red-200 bg-red-50/60 p-6 sm:p-7">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-700">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </span>

        <h1 className="mt-4 font-heading text-2xl font-bold text-charcoal">
          Remove {person.name} from the team page?
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-charcoal/70">
          {person.title && <>{person.title}. </>}
          Their profile will disappear from the public website straight away. The change is
          recorded in the site&apos;s history along with who made it.
        </p>

        <form action={deletePractitioner} className="mt-6 flex flex-wrap items-center gap-3">
          <input type="hidden" name="id" value={person.id} />
          <SubmitButton variant="danger" pendingLabel="Removing…">
            Yes, remove {person.name}
          </SubmitButton>
          <Link
            href={`/admin/team/${person.id}`}
            className="text-sm font-semibold text-charcoal/70 underline-offset-4 hover:text-charcoal hover:underline"
          >
            Keep them
          </Link>
        </form>
      </div>
    </div>
  );
}
