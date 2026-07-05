import type { Metadata } from "next";
import { clinic } from "./site-data";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.kinetictherapyclinic.ca"
).replace(/\/$/, "");

export const SITE_NAME = clinic.name;

type PageMetaInput = {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
};

/**
 * Build consistent per-page metadata (title, description, canonical, OG, Twitter).
 * `title` should be the full title including brand when needed.
 */
export function pageMetadata({
  title,
  description,
  path = "/",
  ogImage = "/images/og-default.jpg",
}: PageMetaInput): Metadata {
  const url = `${SITE_URL}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "en_CA",
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
