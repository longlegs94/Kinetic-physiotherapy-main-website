import type { MetadataRoute } from "next";
import { services } from "@/lib/site-data";
import { getIndexablePosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes = [
    { path: "/", priority: 1 },
    { path: "/services", priority: 0.9 },
    { path: "/team", priority: 0.7 },
    { path: "/about", priority: 0.6 },
    { path: "/testimonials", priority: 0.6 },
    { path: "/blog", priority: 0.6 },
    { path: "/contact", priority: 0.8 },
    { path: "/intake", priority: 0.5 },
  ].map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: r.priority,
  }));

  const serviceRoutes = services.map((s) => ({
    url: `${SITE_URL}/${s.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.85,
  }));

  const blogRoutes = getIndexablePosts().map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: p.date ? new Date(p.date) : now,
    changeFrequency: "yearly" as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...serviceRoutes, ...blogRoutes];
}
