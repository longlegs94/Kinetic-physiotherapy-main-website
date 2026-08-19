import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The staff portal has nothing for a crawler and shouldn't appear in
      // results. The admin layout also sets noindex, since a Disallow only
      // asks politely and does not stop indexing of a URL found elsewhere.
      disallow: "/admin",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
