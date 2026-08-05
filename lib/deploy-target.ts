/**
 * Which deploy target this bundle was built for, and therefore whether the
 * `app/api/**` route handlers are reachable at runtime.
 *
 * Both values are read from `NEXT_PUBLIC_*` env vars so Next inlines them into
 * the client bundle at build time — they are compile-time constants, not
 * runtime lookups, and dead branches get tree-shaken out.
 *
 * See docs/DEPLOY_SITEGROUND.md for how the two targets differ.
 */

/** True for `npm run build:static` (SiteGround / any plain file host). */
export const IS_STATIC_EXPORT = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";

/**
 * Optional absolute origin hosting the API routes for a static build — e.g.
 * `https://api.kinetictherapyclinic.ca` or a small free Vercel project. Set it
 * and the static site regains the server-backed features (AI concierge, AI
 * intake summary, server-side contact relay); leave it unset and the site
 * falls back to the no-server behaviour described below.
 */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim().replace(/\/+$/, "");

/**
 * Whether the Next route handlers can be called at all.
 *
 * A Node deploy always has them. A static deploy only has them when
 * API_BASE_URL points somewhere that does. When this is false:
 *   - contact/intake/feedback/ICBC forms post straight to Web3Forms from the
 *     browser, or fall back to mailto: (lib/submit-contact.ts);
 *   - the AI concierge opens in its offline state, showing call/book options;
 *   - the intake form skips the AI summary and sends the raw answers.
 */
export const HAS_SERVER_API = !IS_STATIC_EXPORT || API_BASE_URL !== "";

/** Resolves an app-relative API path against the configured API origin. */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
