"use client";

import Link from "next/link";
import { useActionState } from "react";

import { savePractitioner } from "@/app/admin/content-actions";
import { emptySaveState } from "@/lib/admin/save-state";
import { Checkbox, Field, FormMessage, SubmitButton, TextArea } from "./FormFields";

export type PractitionerDefaults = {
  name: string;
  title: string;
  category: string;
  bio: string;
  specialInterests: string;
  languages: string;
  icbcAccepted: boolean;
  schedule: string;
  bookingUrl: string;
};

/**
 * Add / edit form for one therapist.
 *
 * `id` is the database row's id, or "new". Identifying rows by id rather than
 * by position means two people editing the list at once cannot end up writing
 * over each other because the ordering shifted underneath them.
 */
export function PractitionerForm({
  id,
  defaults,
  categories,
}: {
  id: string;
  defaults: PractitionerDefaults;
  categories: string[];
}) {
  const [state, formAction] = useActionState(savePractitioner, emptySaveState);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="id" value={id} />

      <FormMessage message={state.message} />

      <Field
        name="name"
        label="Name"
        required
        defaultValue={defaults.name}
        errors={state.errors}
        placeholder="Jane Smith"
      />

      <Field
        name="title"
        label="Title"
        required
        hint="Their registered designation, exactly as it should appear publicly."
        defaultValue={defaults.title}
        errors={state.errors}
        placeholder="Registered Massage Therapist"
      />

      <div>
        <Field
          name="category"
          label="Category"
          required
          hint="Groups them on the team page. Reuse an existing category where it fits."
          defaultValue={defaults.category}
          errors={state.errors}
          placeholder="Massage Therapy"
        />
        {categories.length > 0 && (
          <p className="mt-1.5 text-sm text-charcoal/50">
            Already in use: {categories.join(" · ")}
          </p>
        )}
      </div>

      <TextArea
        name="bio"
        label="Bio"
        hint="A short paragraph shown on their profile card."
        defaultValue={defaults.bio}
        errors={state.errors}
        rows={6}
      />

      <TextArea
        name="specialInterests"
        label="Special interests"
        hint="One per line. Leave blank if there aren't any."
        defaultValue={defaults.specialInterests}
        errors={state.errors}
        rows={4}
        placeholder={"Sports injuries\nPost-surgical rehab"}
      />

      <TextArea
        name="languages"
        label="Languages"
        hint="One per line, beyond English."
        defaultValue={defaults.languages}
        errors={state.errors}
        rows={3}
        placeholder={"Punjabi\nHindi"}
      />

      <Field
        name="schedule"
        label="Schedule"
        hint="Free text, e.g. “Tuesdays and Thursdays”. Leave blank to omit."
        defaultValue={defaults.schedule}
        errors={state.errors}
      />

      <Field
        name="bookingUrl"
        label="Personal booking link"
        hint="Optional. Only if they book through a different Jane link than the clinic's."
        defaultValue={defaults.bookingUrl}
        errors={state.errors}
        placeholder="https://…"
      />

      <Checkbox
        name="icbcAccepted"
        label="Accepts ICBC patients"
        hint="Shown as a badge on their profile."
        defaultChecked={defaults.icbcAccepted}
      />

      <div className="flex flex-wrap items-center gap-3 border-t border-silver/70 pt-6">
        <SubmitButton pendingLabel="Saving…">
          {id === "new" ? "Add therapist" : "Save changes"}
        </SubmitButton>
        <Link
          href="/admin/team"
          className="text-sm font-semibold text-charcoal/60 underline-offset-4 hover:text-charcoal hover:underline"
        >
          Cancel
        </Link>
        {id !== "new" && (
          <Link
            href={`/admin/team/${id}/remove`}
            className="ml-auto text-sm font-semibold text-red-700 underline-offset-4 hover:underline"
          >
            Remove this therapist
          </Link>
        )}
      </div>
    </form>
  );
}
