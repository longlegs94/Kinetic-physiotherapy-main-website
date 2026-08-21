import type { Metadata } from "next";
import { clinic } from "./site-data";
import { getClinic } from "./content/store";
import { withBrand } from "./brand";
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.kinetictherapyclinic.ca"
).replace(/\/$/, "");

/**
 * The clinic's name as bundled at build time.
 *
 * A fallback, not the source of truth — the name is editable from the staff
 * portal, so anything a visitor reads should resolve it live through
 * `buildPageMetadata`. This exists for the few places that cannot await:
 * the generated OG image and the last-resort error page.
 */
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
export function pageMetadata(
  { title, description, path = "/", ogImage, noIndex = false }: PageMetaInput,
  siteName: string = SITE_NAME
): Metadata {
  const url = `${SITE_URL}${path}`;
  title = withBrand(title, siteName);
  description = withBrand(description, siteName);
  return {
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
    // `absolute` bypasses the root layout's "%s | <clinic>"
    // template. Page titles here already include the brand where wanted, so
    // the template would otherwise double it ("… | Clinic | Clinic").
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName,
      locale: "en_CA",
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: siteName }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

/**
 * Per-page metadata with the live clinic name substituted in.
 *
 * Pages export this as `generateMetadata` so the name is read per request. It
 * falls back to the bundled name if the database is unreachable, for the same
 * reason the rest of the content layer does: a page with a slightly stale
 * title is better than a page that fails to render.
 */
export async function buildPageMetadata(input: PageMetaInput): Promise<Metadata> {
  const { name } = await getClinic();
  return pageMetadata(input, name || SITE_NAME);
}
