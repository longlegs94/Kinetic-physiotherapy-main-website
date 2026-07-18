import { getAllPosts, type PostMeta } from "@/lib/blog";
import { resolveRelated, type Service } from "@/lib/site-data";

/**
 * Explicit cross-links between service pages and blog posts, keyed by slug.
 *
 * Kept as a small hand-maintained map (rather than automatic tag matching)
 * so the pairings stay editorially deliberate — e.g. the ICBC post links to
 * the ICBC service first, not just anything tagged "Physiotherapy". Both
 * sides are defensively filtered against the live, published-only post/
 * service lists below, so a slug typo or a post moved back to draft simply
 * drops the link instead of producing a 404.
 */
const SERVICE_TO_POST_SLUGS: Record<string, string[]> = {
  "physiotherapy-maple-ridge": [
    "best-treatment-options-for-lower-back-pain",
    "physio-vs-massage-which-should-you-book",
    "icbc-physiotherapy-what-patients-should-know",
  ],
  "massage-therapy-maple-ridge": ["physio-vs-massage-which-should-you-book"],
  "chiropractor-maple-ridge": ["best-treatment-options-for-lower-back-pain"],
  "icbc-physio-maple-ridge": ["icbc-physiotherapy-what-patients-should-know"],
  "pregnancy-massage-maple-ridge": ["physio-vs-massage-which-should-you-book"],
  // kinesiology-active-rehab, acupuncture, shockwave-therapy, and
  // orthotics-bracing don't have a topically dedicated published post yet
  // (their natural matches — e.g. the shockwave/plantar-fasciitis and
  // active-rehab-after-a-car-accident drafts — are still draft:true). Until
  // those publish, point them at the general conservative-care overview so
  // every service page satisfies "links to ≥1 post" rather than rendering
  // an empty RelatedReading section. Revisit once more drafts go live.
  "kinesiology-active-rehab-maple-ridge": ["best-treatment-options-for-lower-back-pain"],
  "acupuncture-maple-ridge": ["best-treatment-options-for-lower-back-pain"],
  "shockwave-therapy-maple-ridge": ["best-treatment-options-for-lower-back-pain"],
  "orthotics-bracing-maple-ridge": ["best-treatment-options-for-lower-back-pain"],
};

const POST_TO_SERVICE_SLUGS: Record<string, string[]> = {
  "icbc-physiotherapy-what-patients-should-know": [
    "icbc-physio-maple-ridge",
    "physiotherapy-maple-ridge",
  ],
  "physio-vs-massage-which-should-you-book": [
    "physiotherapy-maple-ridge",
    "massage-therapy-maple-ridge",
  ],
  "best-treatment-options-for-lower-back-pain": [
    "physiotherapy-maple-ridge",
    "chiropractor-maple-ridge",
  ],
};

const MAX_RELATED = 3;

/**
 * Published blog posts related to a service, for use on service pages.
 * Always published only (draft posts are excluded by getAllPosts(false)),
 * regardless of what's listed in the map above.
 */
export function getRelatedPostsForService(serviceSlug: string): PostMeta[] {
  const slugs = SERVICE_TO_POST_SLUGS[serviceSlug] ?? [];
  if (slugs.length === 0) return [];
  const published = getAllPosts(false);
  const bySlug = new Map(published.map((p) => [p.slug, p]));
  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((p): p is PostMeta => Boolean(p))
    .slice(0, MAX_RELATED);
}

/**
 * Services related to a blog post, for use on the blog post template.
 */
export function getRelatedServicesForPost(postSlug: string): Service[] {
  const slugs = POST_TO_SERVICE_SLUGS[postSlug] ?? [];
  if (slugs.length === 0) return [];
  return resolveRelated(slugs).slice(0, MAX_RELATED);
}
