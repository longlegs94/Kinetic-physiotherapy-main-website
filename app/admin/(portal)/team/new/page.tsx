import { redirect } from "next/navigation";

import { readContent, contentOf } from "@/lib/admin/content-source";
import { listPractitioners } from "@/lib/admin/content-schema";
import { PractitionerForm } from "@/components/admin/PractitionerForm";
import { Breadcrumb, DeployPendingNotice } from "@/components/admin/StatusBanners";

import { practitionerDefaults, usedCategories } from "../defaults";

export const metadata = { title: "Add therapist" };

export default async function NewTherapistPage() {
  const source = await readContent();
  // Nothing to add to if the file can't be written; the list page explains why.
  if (source.mode !== "live") redirect("/admin/team");

  const categories = usedCategories(listPractitioners(contentOf(source)));

  return (
    <div className="max-w-2xl space-y-6">
      <Breadcrumb href="/admin/team" label="Therapists" />

      <div>
        <h1 className="font-heading text-3xl font-bold text-charcoal">Add a therapist</h1>
        <p className="mt-2 text-[15px] text-charcoal/60">
          They&apos;ll appear on the public team page once the website rebuilds.
        </p>
      </div>

      <DeployPendingNotice />

      <div className="rounded-card border border-silver/70 bg-white p-6 sm:p-7">
        <PractitionerForm index="new" defaults={practitionerDefaults(null)} categories={categories} />
      </div>
    </div>
  );
}
