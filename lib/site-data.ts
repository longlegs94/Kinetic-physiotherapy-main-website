import content from "@/content/site-content.json";

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

export const clinic = data.clinic;
export const navigation = data.navigation;
export const homepage = data.homepage;
export const services = data.services;
export const practitioners = data.practitioners;
export const testimonials = data.testimonials;
export const faqs = data.faqs;

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

/**
 * Practitioners relevant to a given service, for the "Your team" preview on
 * service and location pages.
 *
 * Most services match by a simple substring check against practitioner
 * category (e.g. "Physio" / "Physiotherapy"). Two services need an explicit
 * rule instead, because no category substring connects them to staff who
 * genuinely provide them:
 * - ICBC treatment support isn't its own discipline — it's delivered by
 *   whichever practitioners accept ICBC patients, which the data already
 *   tracks via `icbcAccepted`.
 * - "Pregnancy Massage" doesn't substring-match the "Massage Therapy"
 *   category in either direction, even though RMTs are the staff who
 *   provide it.
 * Services with no data-backed match (e.g. chiropractic, shockwave,
 * orthotics — no practitioner category currently covers them) correctly
 * return an empty list rather than guessing.
 */
export function getPractitionersForService(service: Service): Practitioner[] {
  if (service.slug === "icbc-physio-maple-ridge") {
    return practitioners.filter((p) => p.icbcAccepted);
  }
  if (service.slug === "pregnancy-massage-maple-ridge") {
    return practitioners.filter((p) => p.category === "Massage Therapy");
  }
  return practitioners.filter(
    (p) =>
      p.category.toLowerCase().includes(service.shortName.toLowerCase()) ||
      service.name.toLowerCase().includes(p.category.toLowerCase())
  );
}
