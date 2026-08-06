import content from "@/content/site-content.json";
import { filterVerified } from "@/lib/verification";

/**
 * Typed access layer over content/site-content.json.
 * The clinic owner edits the JSON; components read through these types.
 */

export type Hours = { days: string; hours: string; needsVerification?: boolean };
export type TrustBadge = { label: string; needsVerification?: boolean };

export type Clinic = {
  name: string;
  positioning: string;
  city: string;
  province: string;
  country: string;
  address: string;
  phone: string;
  email: string;
  fax?: string;
  janeBookingUrl: string;
  socials?: { facebook?: string; instagram?: string };
  hours: Hours[];
  trustBadges: TrustBadge[];
};

export type NavItem = { label: string; href: string };

export type PainPoint = { label: string; recommended: string[] };

export type Service = {
  slug: string;
  name: string;
  shortName: string;
  category: string;
  description: string;
  heroTitle: string;
  heroSubtitle: string;
  conditions: string[];
  process: string[];
  relatedServices: string[];
  ctaLabel: string;
  bookingUrl?: string;
  needsVerification?: boolean;
  faqs?: Faq[];
};

export type Practitioner = {
  name: string;
  title: string;
  category: string;
  bio?: string;
  specialInterests?: string[];
  languages?: string[];
  icbcAccepted?: boolean;
  schedule?: string;
  bookingUrl?: string;
  image?: string;
  needsVerification?: boolean;
};

export type Testimonial = {
  quote: string;
  name: string;
  rating: number;
  needsVerification?: boolean;
};

export type Faq = { question: string; answer: string; needsVerification?: boolean };

type SiteContent = {
  clinic: Clinic;
  navigation: NavItem[];
  homepage: {
    hero: {
      eyebrow: string;
      titleLines: string[];
      subtitle: string;
      primaryCta: string;
      secondaryCta: string;
    };
    painPoints: PainPoint[];
  };
  services: Service[];
  practitioners: Practitioner[];
  testimonials: Testimonial[];
  faqs: Faq[];
};

const data = content as SiteContent;

/**
 * Content flagged `needsVerification` is withheld from production builds —
 * see lib/verification.ts for why, and for the NEXT_PUBLIC_SHOW_UNVERIFIED
 * escape hatch used on preview deploys. Filtering happens here, at the single
 * point every component reads through, so no page can accidentally render an
 * unconfirmed testimonial or practitioner credential.
 *
 * Services keep their pages even when flagged (removing one would 404 a URL
 * that navigation and the sitemap point at); only their FAQs are filtered.
 */
export const clinic: Clinic = {
  ...data.clinic,
  trustBadges: filterVerified(data.clinic.trustBadges),
  hours: filterVerified(data.clinic.hours),
};
export const navigation = data.navigation;
export const homepage = data.homepage;
export const services: Service[] = data.services.map((service) => ({
  ...service,
  faqs: service.faqs ? filterVerified(service.faqs) : undefined,
}));
export const practitioners = filterVerified(data.practitioners);
export const testimonials = filterVerified(data.testimonials);
export const faqs = filterVerified(data.faqs);

/** Jane booking URL — env override wins, then clinic JSON. */
export const janeBookingUrl =
  process.env.NEXT_PUBLIC_JANE_BOOKING_URL || clinic.janeBookingUrl;

/** tel: href from the display phone number. */
export const phoneHref = `tel:${clinic.phone.replace(/[^\d+]/g, "")}`;
export const emailHref = `mailto:${clinic.email}`;

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}

export function getServicesByCategory(category: string): Service[] {
  return services.filter((s) => s.category === category);
}

/** Service categories in intended display order. */
export const serviceCategories = [
  "Rehab and Movement",
  "Hands-on Therapy",
  "Pain and Wellness",
  "Women and Family Care",
  "Insurance and Injury Support",
];

/** Resolve a related-services slug list into full Service objects. */
export function resolveRelated(slugs: string[]): Service[] {
  return slugs
    .map((slug) => getService(slug))
    .filter((s): s is Service => Boolean(s));
}
