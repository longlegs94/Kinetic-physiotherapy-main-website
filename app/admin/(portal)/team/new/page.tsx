import { redirect } from "next/navigation";

import { listPractitioners } from "@/lib/content/admin-store";
import { writeConfigured } from "@/lib/content/supabase";
import { PractitionerForm } from "@/components/admin/PractitionerForm";
import { Breadcrumb, DeployPendingNotice } from "@/components/admin/StatusBanners";

export const metadata = { title: "Add therapist" };

export default async function NewTherapistPage() {
  if (!writeConfigured()) redirect("/admin/team");

  const all = await listPractitioners();
  const categories = [...new Set(all.map((p) => p.category).filter(Boolean))].sort();

  return (
    <div className="max-w-2xl space-y-6">
      <Breadcrumb href="/admin/team" label="Therapists" />

      <div>
        <h1 className="font-heading text-3xl font-bold text-charcoal">Add a therapist</h1>
        <p className="mt-2 text-[15px] text-charcoal/60">
          They&apos;ll appear on the public team page as soon as you save.
        </p>
      </div>

      <DeployPendingNotice />

      <div className="rounded-card border border-silver/70 bg-white p-6 sm:p-7">
        <PractitionerForm
          id="new"
          defaults={{
            name: "",
            title: "",
            category: "",
            bio: "",
            specialInterests: "",
            languages: "",
            icbcAccepted: false,
            schedule: "",
            bookingUrl: "",
          }}
          categories={categories}
        />
      </div>
    </div>
  );
}
