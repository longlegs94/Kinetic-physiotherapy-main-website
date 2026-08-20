import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";

import { deletePractitioner } from "@/app/admin/content-actions";
import { readContent, contentOf } from "@/lib/admin/content-source";
import { getPractitioner } from "@/lib/admin/content-schema";
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
  params: Promise<{ index: string }>;
}) {
  const { index: raw } = await params;
  const index = Number(raw);
  if (!Number.isInteger(index) || index < 0) notFound();

  const source = await readContent();
  if (source.mode !== "live") redirect("/admin/team");

  const person = getPractitioner(contentOf(source), index);
  if (!person) notFound();

  const name = typeof person.name === "string" ? person.name : "This therapist";
  const title = typeof person.title === "string" ? person.title : "";

  return (
    <div className="max-w-xl space-y-6">
      <Breadcrumb href={`/admin/team/${index}`} label={name} />

      <div className="rounded-card border border-red-200 bg-red-50/60 p-6 sm:p-7">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-700">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </span>

        <h1 className="mt-4 font-heading text-2xl font-bold text-charcoal">
          Remove {name} from the team page?
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-charcoal/70">
          {title && <>{title}. </>}
          Their profile will stop appearing on the public website once it rebuilds. The change is
          recorded in the site&apos;s history, so it can be undone by whoever manages the code —
          but not from this portal.
        </p>

        <form action={deletePractitioner} className="mt-6 flex flex-wrap items-center gap-3">
          <input type="hidden" name="index" value={index} />
          <input type="hidden" name="name" value={name} />
          <SubmitButton variant="danger" pendingLabel="Removing…">
            Yes, remove {name}
          </SubmitButton>
          <Link
            href={`/admin/team/${index}`}
            className="text-sm font-semibold text-charcoal/70 underline-offset-4 hover:text-charcoal hover:underline"
          >
            Keep them
          </Link>
        </form>
      </div>
    </div>
  );
}
