import content from "@/content/site-content.json";

/**
 * Production gate for content the clinic hasn't confirmed yet.
 *
 * Entries in content/site-content.json carry `needsVerification: true` when
 * they were drafted from public sources rather than confirmed by the clinic.
 * Publishing them is a real risk, not a cosmetic one: unconfirmed testimonials
 * are advertising claims, and unconfirmed practitioner entries assert
 * professional credentials. Both are hidden in production until cleared.
 *
 * Escape hatch: set NEXT_PUBLIC_SHOW_UNVERIFIED=1 to render everything — the
 * intended setting for preview deploys, where the clinic reviews drafts before
 * approving them. It is deliberately a NEXT_PUBLIC_ var so the same value
 * drives both server rendering and client components.
 *
 * Service *pages* are exempt from removal on purpose. A service flagged
 * unverified still needs its route to exist — dropping it would 404 a URL that
 * navigation, the sitemap and related-service links all point at, turning a
 * content question into broken site structure. Their unverified FAQs are still
 * filtered.
 */

export type Verifiable = { needsVerification?: boolean };

/** True when NEXT_PUBLIC_SHOW_UNVERIFIED=1 — preview/staging behaviour. */
export const showUnverified = process.env.NEXT_PUBLIC_SHOW_UNVERIFIED === "1";

/** An item is publishable unless it is explicitly flagged for verification. */
export function isVerified(item: Verifiable): boolean {
  return item.needsVerification !== true;
}

/** Drops unverified entries unless the preview escape hatch is enabled. */
export function filterVerified<T extends Verifiable>(items: readonly T[]): T[] {
  if (showUnverified) return [...items];
  return items.filter(isVerified);
}

type RawContent = {
  clinic?: { trustBadges?: Verifiable[]; hours?: Verifiable[] };
  services?: (Verifiable & { slug?: string; faqs?: Verifiable[] })[];
  practitioners?: (Verifiable & { name?: string })[];
  testimonials?: (Verifiable & { name?: string })[];
  faqs?: (Verifiable & { question?: string })[];
};

/**
 * Enumerates every still-unverified entry as a human-readable path, for the
 * build-time report in scripts/check-env.ts. Reads the raw JSON rather than
 * the filtered exports in lib/site-data, so it sees what was hidden.
 */
export function collectUnverifiedContent(): string[] {
  const data = content as RawContent;
  const paths: string[] = [];

  data.clinic?.trustBadges?.forEach((badge, i) => {
    if (!isVerified(badge)) paths.push(`clinic.trustBadges[${i}]`);
  });
  data.clinic?.hours?.forEach((entry, i) => {
    if (!isVerified(entry)) paths.push(`clinic.hours[${i}]`);
  });
  data.practitioners?.forEach((p, i) => {
    if (!isVerified(p)) paths.push(`practitioners[${i}] (${p.name ?? "unnamed"})`);
  });
  data.testimonials?.forEach((t, i) => {
    if (!isVerified(t)) paths.push(`testimonials[${i}] (${t.name ?? "anonymous"})`);
  });
  data.faqs?.forEach((f, i) => {
    if (!isVerified(f)) paths.push(`faqs[${i}]`);
  });
  data.services?.forEach((s, i) => {
    if (!isVerified(s)) paths.push(`services[${i}] (${s.slug ?? "unknown"})`);
    s.faqs?.forEach((f, j) => {
      if (!isVerified(f)) paths.push(`services[${i}].faqs[${j}] (${s.slug ?? "unknown"})`);
    });
  });

  return paths;
}
