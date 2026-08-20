import { notFound, redirect } from "next/navigation";

import { getPractitioner, listPractitioners } from "@/lib/content/admin-store";
import { writeConfigured } from "@/lib/content/supabase";
import { PractitionerForm } from "@/components/admin/PractitionerForm";
import { Breadcrumb, DeployPendingNotice } from "@/components/admin/StatusBanners";

export const metadata = { title: "Edit therapist" };

/** Categories already in use, so the form can suggest them instead of letting
 *  a typo create a one-person group on the public team page. */
async function usedCategories(): Promise<string[]> {
  const all = await listPractitioners();
  return [...new Set(all.map((p) => p.category).filter(Boolean))].sort();
}

export default async function EditTherapistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!writeConfigured()) redirect("/admin/team");

  const { id } = await params;
  const person = await getPractitioner(id);
  if (!person) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <Breadcrumb href="/admin/team" label="Therapists" />

      <div>
        <h1 className="font-heading text-3xl font-bold text-charcoal">{person.name}</h1>
        <p className="mt-2 text-[15px] text-charcoal/60">
          Editing what the public team page says about them.
        </p>
      </div>

      <DeployPendingNotice />

      <div className="rounded-card border border-silver/70 bg-white p-6 sm:p-7">
        <PractitionerForm
          id={person.id}
          defaults={{
            name: person.name,
            title: person.title,
            category: person.category,
            bio: person.bio,
            specialInterests: person.specialInterests.join("\n"),
            languages: person.languages.join("\n"),
            icbcAccepted: person.icbcAccepted,
            schedule: person.schedule,
            bookingUrl: person.bookingUrl,
          }}
          categories={await usedCategories()}
        />
      </div>
    </div>
  );
}
