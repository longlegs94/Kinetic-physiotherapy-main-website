import type { FieldError } from "./content-schema";

/**
 * The result shape the content forms pass through `useActionState`.
 *
 * This lives outside `app/admin/content-actions.ts` because a `"use server"`
 * module may only export async functions — exporting the initial-state object
 * from there fails the build with "a 'use server' file can only export async
 * functions, found object". Types are erased and would be fine, but the
 * constant is not, so both live here and the actions import them.
 */
export type SaveState = {
  /** Problems tied to a specific input, rendered under that field. */
  errors: FieldError[];
  /** A problem with the save itself — a conflict, a failed commit. */
  message: string | null;
};

export const emptySaveState: SaveState = { errors: [], message: null };
