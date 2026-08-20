"use server";

import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin/auth";
import { validateClinic, validatePractitioner, type FieldError } from "@/lib/admin/content-schema";
import { emptySaveState, type SaveState } from "@/lib/admin/save-state";
import {
  ContentStoreError,
  createPractitioner,
  deletePractitioner as removePractitioner,
  updateClinic,
  updatePractitioner,
} from "@/lib/content/admin-store";

/**
 * Saving content changes.
 *
 * Every action re-establishes the session through `requireAdmin()` before it
 * touches anything. Rendering a form on a page behind the login is not a
 * security boundary — a Server Action has a callable endpoint of its own, and
 * these ones write to the database, so the check belongs here rather than only
 * on the page that drew the form.
 *
 * Each action validates first, writes second, and lets the store record the
 * change and refresh the public site. Nothing here builds SQL or object shapes
 * from raw form input: the validators return a fixed set of typed fields, and
 * the store maps exactly those onto columns.
 */

function fail(message: string): SaveState {
  return { ...emptySaveState, message };
}

function fieldErrors(errors: FieldError[]): SaveState {
  return { errors, message: null };
}

/** Turns a thrown error into something a receptionist can act on. */
function describe(error: unknown): string {
  if (error instanceof ContentStoreError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong saving the change.";
}

/** Rows are identified by their database id. Anything that isn't a UUID is a
 *  stale link or a hand-edited URL, not something to go looking for. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function practitionerId(raw: unknown): string | null {
  const value = String(raw ?? "").trim();
  return UUID.test(value) ? value : null;
}

export async function savePractitioner(
  _previous: SaveState,
  formData: FormData
): Promise<SaveState> {
  const session = await requireAdmin();

  const raw = String(formData.get("id") ?? "").trim();
  const isNew = raw === "" || raw === "new";
  const id = isNew ? null : practitionerId(raw);
  if (!isNew && !id) {
    return fail("That therapist couldn't be identified. Reload the list and try again.");
  }

  const validated = validatePractitioner(formData);
  if (!validated.ok) return fieldErrors(validated.errors);

  try {
    if (id) {
      await updatePractitioner(id, validated.value, session.email);
    } else {
      await createPractitioner(validated.value, session.email);
    }
  } catch (error) {
    return fail(describe(error));
  }

  redirect(`/admin/team?saved=${id ? "updated" : "added"}`);
}

export async function deletePractitioner(formData: FormData): Promise<void> {
  const session = await requireAdmin();

  const id = practitionerId(formData.get("id"));
  if (!id) redirect("/admin/team?error=unknown");

  try {
    await removePractitioner(id, session.email);
  } catch (error) {
    redirect(`/admin/team?error=${encodeURIComponent(describe(error))}`);
  }

  redirect("/admin/team?saved=removed");
}

export async function saveClinic(_previous: SaveState, formData: FormData): Promise<SaveState> {
  const session = await requireAdmin();

  const validated = validateClinic(formData);
  if (!validated.ok) return fieldErrors(validated.errors);

  try {
    await updateClinic(validated.value, session.email);
  } catch (error) {
    return fail(describe(error));
  }

  redirect("/admin/clinic?saved=1");
}
