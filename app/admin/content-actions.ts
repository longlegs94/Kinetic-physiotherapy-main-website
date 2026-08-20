"use server";

import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin/auth";
import { ContentRepoError, loadContent, repoConfig, saveContent } from "@/lib/admin/content-repo";
import { emptySaveState, type SaveState } from "@/lib/admin/save-state";
import {
  applyClinic,
  removePractitioner,
  upsertPractitioner,
  validateClinic,
  validatePractitioner,
  type FieldError,
} from "@/lib/admin/content-schema";

/**
 * Saving content changes.
 *
 * Every action re-establishes the session through `requireAdmin()` before it
 * touches anything. Rendering a form on a page behind the login is not a
 * security boundary — a Server Action has a callable endpoint of its own, and
 * these ones can commit to the repository, so the check belongs here rather
 * than only on the page that drew the form.
 *
 * The shape of each action is the same: load the current file from GitHub,
 * validate the form, apply a narrow mutation from content-schema, and commit
 * with the SHA the edit was based on. Nothing here writes user-supplied JSON;
 * see lib/admin/content-schema.ts for why that matters.
 */

function fail(message: string): SaveState {
  return { ...emptySaveState, message };
}

function fieldErrors(errors: FieldError[]): SaveState {
  return { errors, message: null };
}

/** Turns a thrown error into something a receptionist can act on. */
function describe(error: unknown): string {
  if (error instanceof ContentRepoError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong saving the change.";
}

type Committed = { ok: true } | { ok: false; state: SaveState };

/**
 * Load, mutate, commit. `mutate` receives the parsed file and returns the new
 * one; it throws with a readable message when the edit no longer applies.
 */
async function commit(
  summary: string,
  authorEmail: string,
  mutate: (content: unknown) => unknown
): Promise<Committed> {
  const config = repoConfig();
  if (!config) {
    return {
      ok: false,
      state: fail(
        "Saving isn't set up on this deployment — CONTENT_GITHUB_TOKEN and CONTENT_GITHUB_REPO need to be configured."
      ),
    };
  }

  try {
    const { json, sha } = await loadContent(config);
    const next = mutate(json);
    await saveContent(config, next, sha, summary, authorEmail);
    return { ok: true };
  } catch (error) {
    return { ok: false, state: fail(describe(error)) };
  }
}

/** Parses the `index` field: "new" means add, a number means edit that row. */
function parseIndex(raw: unknown): number | null | "invalid" {
  const value = String(raw ?? "").trim();
  if (value === "" || value === "new") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return "invalid";
  return parsed;
}

export async function savePractitioner(
  _previous: SaveState,
  formData: FormData
): Promise<SaveState> {
  const session = await requireAdmin();

  const index = parseIndex(formData.get("index"));
  if (index === "invalid") return fail("That therapist couldn't be identified. Reload and try again.");

  const validated = validatePractitioner(formData);
  if (!validated.ok) return fieldErrors(validated.errors);

  const summary =
    index === null
      ? `Add ${validated.value.name} to the team`
      : `Update ${validated.value.name}'s profile`;

  const result = await commit(summary, session.email, (content) =>
    upsertPractitioner(content, index, validated.value)
  );
  if (!result.ok) return result.state;

  redirect(`/admin/team?saved=${index === null ? "added" : "updated"}`);
}

export async function deletePractitioner(formData: FormData): Promise<void> {
  const session = await requireAdmin();

  const index = parseIndex(formData.get("index"));
  if (index === "invalid" || index === null) {
    redirect("/admin/team?error=unknown");
  }

  const name = String(formData.get("name") ?? "a therapist");
  const result = await commit(`Remove ${name} from the team`, session.email, (content) =>
    removePractitioner(content, index)
  );

  redirect(
    result.ok ? "/admin/team?saved=removed" : `/admin/team?error=${encodeURIComponent(result.state.message ?? "failed")}`
  );
}

export async function saveClinic(_previous: SaveState, formData: FormData): Promise<SaveState> {
  const session = await requireAdmin();

  const validated = validateClinic(formData);
  if (!validated.ok) return fieldErrors(validated.errors);

  const result = await commit("Update clinic contact information", session.email, (content) =>
    applyClinic(content, validated.value)
  );
  if (!result.ok) return result.state;

  redirect("/admin/clinic?saved=1");
}
