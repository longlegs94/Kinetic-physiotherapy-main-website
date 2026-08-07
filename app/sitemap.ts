import type { MetadataRoute } from "next";
import { services } from "@/lib/site-data";
import { getIndexablePosts } from "@/lib/blog";
import { locations } from "@/content/locations";
import { SITE_URL } from "@/lib/seo";
import content from "@/content/site-content.json";

/**
 * `lastModified` previously used `new Date()` for every route, so each build
 * declared the entire site freshly modified. Search engines treat a lastmod
 * that always equals the crawl date as noise and begin ignoring it, costing
 * exactly the recrawl priority the field exists to signal.
 *
 * File mtimes look like the obvious fix but are not one here: Vercel clones
 * the repository fresh for every build, so every file's mtime is the deploy
 * time — the same lie in a different costume. The honest source is a date
 * committed alongside the content, so `contentUpdated` in site-content.json
 * is the single value to bump when the clinic edits copy.
 *
 * When it is absent or unparsable, `lastModified` is omitted rather than
 * guessed. An absent lastmod is simply ignored by crawlers; a wrong one
 * teaches them to distrust the whole file.
 */
function parseContentUpdated(): Date | undefined {
  const raw = (content as { contentUpdated?: unknown }).contentUpdated;
  if (typeof raw !== "string") return undefined;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

const CONTENT_UPDATED = parseContentUpdated();

/** Spreads `lastModified` only when a trustworthy date exists. */
function modified(date: Date | undefined): { lastModified?: Date } {
  return date ? { lastModified: date } : {};
}

export default function sitemap(): MetadataRoute.Sitemap {
  // /intake is deliberately absent: it is noindex (see app/intake/page.tsx),
  // and listing a noindex URL in the sitemap sends crawlers contradictory
  // instructions about the same page.
  const staticRoutes = [
    { path: "/", priority: 1 },
    { path: "/services", priority: 0.9 },
    { path: "/team", priority: 0.7 },
    { path: "/about", priority: 0.6 },
    { path: "/testimonials", priority: 0.6 },
    { path: "/blog", priority: 0.6 },
    { path: "/contact", priority: 0.8 },
    { path: "/locations", priority: 0.7 },
  ].map((r) => ({
    url: `${SITE_URL}${r.path}`,
    ...modified(CONTENT_UPDATED),
    changeFrequency: "monthly" as const,
    priority: r.priority,
  }));

  const serviceRoutes = services.map((s) => ({
    url: `${SITE_URL}/${s.slug}`,
    ...modified(CONTENT_UPDATED),
    changeFrequency: "monthly" as const,
    priority: 0.85,
  }));

  const locationRoutes = locations.map((l) => ({
    url: `${SITE_URL}/locations/${l.slug}`,
    ...modified(CONTENT_UPDATED),
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  const blogRoutes = getIndexablePosts().map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    // Front matter carries the authored date — the most accurate per-URL
    // signal available, and the only one that differs between posts.
    ...modified(p.date ? new Date(p.date) : CONTENT_UPDATED),
    changeFrequency: "yearly" as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...serviceRoutes, ...locationRoutes, ...blogRoutes];
}
