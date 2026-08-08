/**
 * Validated access to the environment variables that change user-visible
 * behaviour, plus the build-time gate that stops a half-configured site from
 * reaching production.
 *
 * The rule this module exists to enforce: a placeholder must never render as
 * if it were real. Previously the Google review link fell back to a literal
 * `placeid=REPLACE_ME` URL, so an unconfigured deploy showed visitors a
 * "Leave a Google review" button that led to a Google error page. Returning
 * null instead lets the UI hide the affected surface, and `assertProductionEnv`
 * turns the same condition into a failed build rather than a silent defect.
 *
 * NEXT_PUBLIC_* values are inlined by the bundler at build time, so they must
 * be referenced as complete literal member expressions — never assembled
 * dynamically, or the substitution silently yields undefined in the browser.
 */

/** Placeholder fragments that mean "nobody filled this in yet". */
const PLACEHOLDER_MARKERS = ["REPLACE_ME", "PLACEHOLDER", "TODO", "XXXX", "CHANGEME"];

function looksLikePlaceholder(value: string): boolean {
  const upper = value.toUpperCase();
  return PLACEHOLDER_MARKERS.some((marker) => upper.includes(marker));
}

/**
 * Validates a Google review URL. Returns null when unset, malformed, still
 * carrying a placeholder, or pointing somewhere other than Google — an
 * attacker-supplied build var shouldn't be able to turn the clinic's review
 * button into a link to an arbitrary origin.
 */
export function parseGoogleReviewUrl(raw: string | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  if (looksLikePlaceholder(trimmed)) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.protocol !== "https:") return null;

  // Accept only Google-owned review surfaces: the classic
  // search.google.com/local/writereview?placeid=… form, g.page short links,
  // and maps.app.goo.gl / goo.gl share links.
  const host = url.hostname.toLowerCase();
  const allowedHosts = [
    "search.google.com",
    "g.page",
    "maps.app.goo.gl",
    "goo.gl",
    "www.google.com",
    "maps.google.com",
  ];
  if (!allowedHosts.includes(host)) return null;

  // A writereview link with an empty or placeholder placeid is still broken.
  if (url.pathname.includes("/writereview")) {
    const placeId = url.searchParams.get("placeid");
    if (!placeId || looksLikePlaceholder(placeId)) return null;
  }

  return url.toString();
}

/**
 * The clinic's Google review link, or null when not configured.
 *
 * Literal `process.env.NEXT_PUBLIC_…` reference so the bundler can inline it
 * for client components.
 */
export const googleReviewUrl: string | null = parseGoogleReviewUrl(
  process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL
);

export type EnvProblem = { variable: string; problem: string };

/**
 * Collects the configuration problems that should block a production deploy.
 * Pure over its input so it can be tested without mutating the real
 * environment; `scripts/check-env.mjs` runs it against `process.env` during
 * `prebuild`.
 *
 * Only variables whose absence produces a *broken or misleading* page are
 * fatal. Optional integrations that degrade cleanly (analytics, the AI
 * concierge) are deliberately not listed — the site is fully usable without
 * them, and failing the build over them would be wrong.
 */
export function collectEnvProblems(env: Record<string, string | undefined>): EnvProblem[] {
  const problems: EnvProblem[] = [];

  const siteUrl = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!siteUrl) {
    problems.push({
      variable: "NEXT_PUBLIC_SITE_URL",
      problem:
        "required in production — canonical URLs, sitemap, JSON-LD and the API origin check all derive from it",
    });
  } else {
    try {
      const parsed = new URL(siteUrl);
      if (parsed.protocol !== "https:") {
        problems.push({ variable: "NEXT_PUBLIC_SITE_URL", problem: "must use https://" });
      }
      if (siteUrl.endsWith("/")) {
        problems.push({
          variable: "NEXT_PUBLIC_SITE_URL",
          problem: "must not end with a trailing slash",
        });
      }
    } catch {
      problems.push({ variable: "NEXT_PUBLIC_SITE_URL", problem: "is not a valid URL" });
    }
  }

  const rawReview = env.NEXT_PUBLIC_GOOGLE_REVIEW_URL?.trim();
  if (rawReview && !parseGoogleReviewUrl(rawReview)) {
    problems.push({
      variable: "NEXT_PUBLIC_GOOGLE_REVIEW_URL",
      problem:
        "is set but not a usable Google review link (must be https, on a Google host, and free of REPLACE_ME-style placeholders)",
    });
  }

  return problems;
}
