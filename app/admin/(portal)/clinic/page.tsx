import { getClinicForEditing } from "@/lib/content/admin-store";
import { writeConfigured } from "@/lib/content/supabase";
import { ClinicForm } from "@/components/admin/ClinicForm";
import { SuccessMessage } from "@/components/admin/FormFields";
import { DeployPendingNotice, LoadErrorNotice, ReadOnlyNotice } from "@/components/admin/StatusBanners";

export const metadata = { title: "Clinic information" };

export default async function ClinicPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const canEdit = writeConfigured();

  let clinic: Awaited<ReturnType<typeof getClinicForEditing>> | null = null;
  let loadError: string | null = null;
  try {
    clinic = await getClinicForEditing();
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Couldn't load the clinic details.";
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-charcoal">Clinic information</h1>
        <p className="mt-2 text-[15px] text-charcoal/60">
          The contact details shown across the website and published to Google.
        </p>
      </div>

      {loadError && <LoadErrorNotice message={loadError} />}
      {!canEdit && !loadError && <ReadOnlyNotice />}
      {saved && (
        <SuccessMessage>
          Contact information saved. It&apos;s already live on the website.
        </SuccessMessage>
      )}
      {canEdit && !loadError && <DeployPendingNotice />}

      {clinic && (
        <div className="rounded-card border border-silver/70 bg-white p-6 sm:p-7">
          {canEdit ? <ClinicForm defaults={clinic} /> : <ReadOnlyClinic defaults={clinic} />}
        </div>
      )}
    </div>
  );
}

/** Plain rendering of the same values when saving isn't available, so the
 *  screen still answers "what does the site currently say?". */
function ReadOnlyClinic({ defaults }: { defaults: Awaited<ReturnType<typeof getClinicForEditing>> }) {
  const rows: [string, string][] = [
    ["Phone", defaults.phone],
    ["Email", defaults.email],
    ["Fax", defaults.fax],
    ["Address", defaults.address],
    ["Booking link", defaults.janeBookingUrl],
    ["Facebook", defaults.facebook],
    ["Instagram", defaults.instagram],
    ["Clinic name", defaults.name],
    ["Tagline", defaults.positioning],
  ];

  return (
    <dl className="space-y-4">
      {rows
        .filter(([, value]) => value)
        .map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm font-semibold text-charcoal">{label}</dt>
            <dd className="mt-0.5 break-words text-[15px] text-charcoal/70">{value}</dd>
          </div>
        ))}
      <div>
        <dt className="text-sm font-semibold text-charcoal">Opening hours</dt>
        <dd className="mt-0.5 space-y-0.5 text-[15px] text-charcoal/70">
          {defaults.hours.map((row, i) => (
            <div key={i}>
              {row.days}: {row.hours}
            </div>
          ))}
        </dd>
      </div>
    </dl>
  );
}
