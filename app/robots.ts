import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Content is fixed at build time (SITE_URL is baked in), so this is always a
// static file. Required explicitly for `output: "export"`, a no-op otherwise.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
