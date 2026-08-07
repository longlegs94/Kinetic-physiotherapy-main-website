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
  /** Optional explicit OG image. When omitted, the app-level generated
   *  opengraph-image (app/opengraph-image.tsx) is inherited automatically. */
  ogImage?: string;
  /**
   * Keeps the page out of search results. For pages that exist to collect
   * information rather than to be found — an indexed form page attracts
   * search traffic to a surface meant for booked patients, and any answers
   * echoed into the URL would land in Search Console.
   */
  noIndex?: boolean;
};

/**
 * Build consistent per-page metadata (title, description, canonical, OG, Twitter).
 * `title` should be the full title including brand when needed.
 */
export function pageMetadata({
  title,
  description,
  path = "/",
  ogImage,
  noIndex = false,
}: PageMetaInput): Metadata {
  const url = `${SITE_URL}${path}`;
  return {
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
    // `absolute` bypasses the root layout's "%s | Kinetic Therapy Clinic"
    // template. Page titles here already include the brand where wanted, so
    // the template would otherwise double it ("… | Clinic | Clinic").
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "en_CA",
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: SITE_NAME }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}
