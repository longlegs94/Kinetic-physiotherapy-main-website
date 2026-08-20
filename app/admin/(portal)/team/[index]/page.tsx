import { notFound, redirect } from "next/navigation";

import { readContent, contentOf } from "@/lib/admin/content-source";
import { getPractitioner, listPractitioners } from "@/lib/admin/content-schema";
import { PractitionerForm } from "@/components/admin/PractitionerForm";
import { Breadcrumb, DeployPendingNotice } from "@/components/admin/StatusBanners";

import { practitionerDefaults, usedCategories } from "../defaults";

export const metadata = { title: "Edit therapist" };

export default async function EditTherapistPage({
  params,
}: {
  params: Promise<{ index: string }>;
}) {
  const { index: raw } = await params;
  const index = Number(raw);
  if (!Number.isInteger(index) || index < 0) notFound();

  const source = await readContent();
  if (source.mode !== "live") redirect("/admin/team");

  const content = contentOf(source);
  const person = getPractitioner(content, index);
  if (!person) notFound();

  const name = typeof person.name === "string" ? person.name : "this therapist";

  return (
    <div className="max-w-2xl space-y-6">
      <Breadcrumb href="/admin/team" label="Therapists" />

      <div>
        <h1 className="font-heading text-3xl font-bold text-charcoal">{name}</h1>
        <p className="mt-2 text-[15px] text-charcoal/60">
          Editing what the public team page says about them.
        </p>
      </div>

      <DeployPendingNotice />

      <div className="rounded-card border border-silver/70 bg-white p-6 sm:p-7">
        <PractitionerForm
          index={index}
          defaults={practitionerDefaults(person)}
          categories={usedCategories(listPractitioners(content))}
        />
      </div>
    </div>
  );
}
