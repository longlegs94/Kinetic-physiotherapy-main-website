/**
 * The brand-name placeholder used in copy that is written at build time but
 * read at request time.
 *
 * Page titles, meta descriptions and the local-SEO landing copy are authored
 * once, in module scope, long before a request can look the clinic up in the
 * database. Rather than convert every carefully tuned sentence into string
 * concatenation, they mark where the name goes and the renderer fills it in.
 * A rename in the staff portal then reaches search-result titles and body
 * copy, not just the footer.
 *
 * Kept free of imports on purpose: client components need `withBrand` too, and
 * the module that reads the database must not follow it into the browser
 * bundle.
 */
export const BRAND_TOKEN = "{brand}";

export function withBrand(value: string, clinicName: string): string {
  return value.split(BRAND_TOKEN).join(clinicName);
}
