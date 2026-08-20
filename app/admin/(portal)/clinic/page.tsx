import { readContent, contentOf } from "@/lib/admin/content-source";
import { getClinic } from "@/lib/admin/content-schema";
import { ClinicForm, type ClinicDefaults } from "@/components/admin/ClinicForm";
import { SuccessMessage } from "@/components/admin/FormFields";
import {
  DeployPendingNotice,
  LoadErrorNotice,
  ReadOnlyNotice,
} from "@/components/admin/StatusBanners";

export const metadata = { title: "Clinic information" };

function defaultsFrom(clinic: Record<string, unknown>): ClinicDefaults {
  const str = (value: unknown): string => (typeof value === "string" ? value : "");
  const socials = (clinic.socials ?? {}) as Record<string, unknown>;
  const hours = Array.isArray(clinic.hours) ? (clinic.hours as Record<string, unknown>[]) : [];

  return {
    name: str(clinic.name),
    positioning: str(clinic.positioning),
    city: str(clinic.city),
    province: str(clinic.province),
    country: str(clinic.country),
    address: str(clinic.address),
    phone: str(clinic.phone),
    email: str(clinic.email),
    fax: str(clinic.fax),
    janeBookingUrl: str(clinic.janeBookingUrl),
    facebook: str(socials.facebook),
    instagram: str(socials.instagram),
    hours: hours.map((row) => ({ days: str(row.days), hours: str(row.hours) })),
  };
}

export default async function ClinicPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const source = await readContent();
  const clinic = getClinic(contentOf(source));
  const canEdit = source.mode === "live";

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-charcoal">Clinic information</h1>
        <p className="mt-2 text-[15px] text-charcoal/60">
          The contact details shown across the website and published to Google.
        </p>
      </div>

      {source.mode === "bundled" && <ReadOnlyNotice />}
      {source.mode === "error" && <LoadErrorNotice message={source.message} />}
      {saved && (
        <SuccessMessage>
          Contact information saved. It will appear on the website within about a minute.
        </SuccessMessage>
      )}
      {canEdit && <DeployPendingNotice />}

      <div className="rounded-card border border-silver/70 bg-white p-6 sm:p-7">
        {canEdit ? (
          <ClinicForm defaults={defaultsFrom(clinic)} />
        ) : (
          <ReadOnlyClinic defaults={defaultsFrom(clinic)} />
        )}
      </div>
    </div>
  );
}

/** Plain rendering of the same values when saving isn't available, so the
 *  screen still answers "what does the site currently say?". */
function ReadOnlyClinic({ defaults }: { defaults: ClinicDefaults }) {
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
