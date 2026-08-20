import type { PractitionerDefaults } from "@/components/admin/PractitionerForm";

/**
 * Turns a stored practitioner record into the strings the form renders.
 *
 * List fields become newline-separated text because a textarea is the right
 * input for "a handful of short lines" — it needs no JavaScript, degrades
 * cleanly, and is obvious to someone who has never used the portal before.
 */
export function practitionerDefaults(record: Record<string, unknown> | null): PractitionerDefaults {
  const list = (value: unknown): string =>
    Array.isArray(value) ? value.filter((v) => typeof v === "string").join("\n") : "";
  const str = (value: unknown): string => (typeof value === "string" ? value : "");

  return {
    name: str(record?.name),
    title: str(record?.title),
    category: str(record?.category),
    bio: str(record?.bio),
    specialInterests: list(record?.specialInterests),
    languages: list(record?.languages),
    icbcAccepted: record?.icbcAccepted === true,
    schedule: str(record?.schedule),
    bookingUrl: str(record?.bookingUrl),
  };
}

/** Categories already in use, so the form can suggest them instead of letting
 *  a typo create a one-person group on the public team page. */
export function usedCategories(practitioners: Record<string, unknown>[]): string[] {
  const seen = new Set<string>();
  for (const person of practitioners) {
    if (typeof person.category === "string" && person.category.trim()) {
      seen.add(person.category.trim());
    }
  }
  return [...seen].sort();
}
