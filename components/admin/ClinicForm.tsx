"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";

import { saveClinic } from "@/app/admin/content-actions";
import { emptySaveState } from "@/lib/admin/save-state";
import { Field, FormMessage, SubmitButton, TextArea } from "./FormFields";

export type ClinicDefaults = {
  name: string;
  positioning: string;
  city: string;
  province: string;
  country: string;
  address: string;
  phone: string;
  email: string;
  fax: string;
  janeBookingUrl: string;
  facebook: string;
  instagram: string;
  hours: { days: string; hours: string }[];
};

const sectionTitle = "font-heading text-sm font-bold uppercase tracking-wide text-charcoal/50";

/**
 * The clinic contact form.
 *
 * These fields reach further than they look: the phone number and address are
 * rendered in the header, footer and contact page *and* published as
 * LocalBusiness structured data that Google reads, and the booking URL is
 * behind every "Book Now" button on the site. The hints say so, because
 * someone editing a phone number should know it changes what Google shows.
 */
export function ClinicForm({ defaults }: { defaults: ClinicDefaults }) {
  const [state, formAction] = useActionState(saveClinic, emptySaveState);
  const [hours, setHours] = useState(
    defaults.hours.length > 0 ? defaults.hours : [{ days: "", hours: "" }]
  );

  const hoursError = state.errors.find((e) => e.field.startsWith("hours"))?.message;

  return (
    <form action={formAction} className="space-y-8" noValidate>
      <FormMessage message={state.message} />

      <section className="space-y-5">
        <h2 className={sectionTitle}>Contact</h2>
        <Field
          name="phone"
          label="Phone"
          required
          hint="Shown in the header, footer and contact page, and used for the click-to-call link."
          defaultValue={defaults.phone}
          errors={state.errors}
          type="tel"
        />
        <Field
          name="email"
          label="Email"
          required
          defaultValue={defaults.email}
          errors={state.errors}
          type="email"
        />
        <Field name="fax" label="Fax" defaultValue={defaults.fax} errors={state.errors} type="tel" />
        <TextArea
          name="address"
          label="Address"
          required
          hint="The full street address as it should be printed and as Google should show it."
          defaultValue={defaults.address}
          errors={state.errors}
          rows={2}
        />
        <div className="grid gap-5 sm:grid-cols-3">
          <Field name="city" label="City" required defaultValue={defaults.city} errors={state.errors} />
          <Field
            name="province"
            label="Province"
            required
            defaultValue={defaults.province}
            errors={state.errors}
          />
          <Field
            name="country"
            label="Country"
            required
            defaultValue={defaults.country}
            errors={state.errors}
          />
        </div>
      </section>

      <section className="space-y-5 border-t border-silver/70 pt-8">
        <h2 className={sectionTitle}>Opening hours</h2>
        <p className="text-sm text-charcoal/55">
          One row per line of the footer. These are also published as the clinic&apos;s opening
          hours in search results.
        </p>

        {hours.map((row, index) => (
          <div key={index} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[180px] flex-1">
              <label className="mb-1.5 block text-sm font-semibold text-charcoal">Days</label>
              <input
                name="hoursDays"
                defaultValue={row.days}
                placeholder="Monday–Friday"
                className="w-full rounded-2xl border border-silver bg-white px-4 py-3 text-charcoal placeholder:text-charcoal/40 focus:border-deep-teal focus:outline-none"
              />
            </div>
            <div className="min-w-[180px] flex-1">
              <label className="mb-1.5 block text-sm font-semibold text-charcoal">Times</label>
              <input
                name="hoursValue"
                defaultValue={row.hours}
                placeholder="8:00am–8:00pm"
                className="w-full rounded-2xl border border-silver bg-white px-4 py-3 text-charcoal placeholder:text-charcoal/40 focus:border-deep-teal focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setHours(hours.filter((_, i) => i !== index))}
              disabled={hours.length === 1}
              aria-label={`Remove hours row ${index + 1}`}
              className="mb-1 rounded-pill border border-charcoal/20 p-3 text-charcoal/60 transition-colors hover:border-red-300 hover:text-red-700 disabled:opacity-40 disabled:hover:border-charcoal/20 disabled:hover:text-charcoal/60"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}

        {hoursError && (
          <p className="text-sm text-red-700" role="alert">
            {hoursError}
          </p>
        )}

        <button
          type="button"
          onClick={() => setHours([...hours, { days: "", hours: "" }])}
          className="inline-flex items-center gap-2 rounded-pill border border-charcoal/20 px-4 py-2 text-sm font-semibold text-charcoal transition-colors hover:border-deep-teal hover:bg-sage/50"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add a row
        </button>
      </section>

      <section className="space-y-5 border-t border-silver/70 pt-8">
        <h2 className={sectionTitle}>Booking and social</h2>
        <Field
          name="janeBookingUrl"
          label="Jane booking link"
          required
          hint="Every “Book Now” button on the site opens this."
          defaultValue={defaults.janeBookingUrl}
          errors={state.errors}
          placeholder="https://…"
        />
        <Field
          name="facebook"
          label="Facebook page"
          defaultValue={defaults.facebook}
          errors={state.errors}
          placeholder="https://www.facebook.com/…"
        />
        <Field
          name="instagram"
          label="Instagram profile"
          defaultValue={defaults.instagram}
          errors={state.errors}
          placeholder="https://www.instagram.com/…"
        />
      </section>

      <section className="space-y-5 border-t border-silver/70 pt-8">
        <h2 className={sectionTitle}>Identity</h2>
        <Field
          name="name"
          label="Clinic name"
          required
          defaultValue={defaults.name}
          errors={state.errors}
        />
        <TextArea
          name="positioning"
          label="Tagline"
          hint="The one-line description under the logo in the footer, and the site's meta description."
          defaultValue={defaults.positioning}
          errors={state.errors}
          rows={2}
        />
      </section>

      <div className="border-t border-silver/70 pt-6">
        <SubmitButton pendingLabel="Saving…">Save contact information</SubmitButton>
      </div>
    </form>
  );
}
