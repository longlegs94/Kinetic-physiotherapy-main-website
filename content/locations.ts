import { getService, clinic, type Service } from "@/lib/site-data";
import { SITE_URL } from "@/lib/seo";
import { withBrand } from "@/lib/brand";

/**
 * Typed data for the four local-SEO "service area" landing pages
 * (Phase 1 ticket C1). Each entry has genuinely unique copy — do not
 * templatize the body paragraphs by swapping only the area name, since
 * that reads as a doorway page to both readers and search engines. The
 * geography, community character, and "commonly booked" service mix are
 * intentionally different per area.
 */

export type LocationArea = {
  slug: string;
  /** Display name, e.g. "Pitt Meadows". */
  name: string;
  heroTitle: string;
  heroSubtitle: string;
  metaTitle: string;
  metaDescription: string;
  /** Heading for the intro section (unique phrasing per area). */
  introTitle: string;
  /** 2 unique paragraphs describing the area and its relationship to the clinic. */
  intro: string[];
  /** One-line intro for the "commonly booked services" section. */
  servicesIntro: string;
  /** Soft, approximate driving-context paragraph — no invented exact minutes. */
  gettingHere: string;
  /** Service slugs (from lib/site-data `services`), ordered by local relevance. */
  commonlyBooked: string[];
};

export const locations: LocationArea[] = [
  {
    slug: "pitt-meadows",
    name: "Pitt Meadows",
    heroTitle: "Physiotherapy & Multidisciplinary Clinic Near Pitt Meadows",
    heroSubtitle:
      "{brand} is a short drive from Pitt Meadows, offering physiotherapy, massage therapy, chiropractic, kinesiology, and acupuncture from one Maple Ridge location.",
    metaTitle: "Physiotherapy Near Pitt Meadows, BC | {brand}",
    metaDescription:
      "Multidisciplinary clinic near Pitt Meadows offering physiotherapy, massage, chiropractic, kinesiology, acupuncture, and ICBC treatment support. Book online at {brand}.",
    introTitle: "Multidisciplinary care, just over the border.",
    intro: [
      "Pitt Meadows is its own city, bordered by Maple Ridge along the Lougheed Highway and Harris Road corridor. Plenty of Pitt Meadows residents already cross into Maple Ridge for schools, shopping, and appointments, and our clinic on 238B Street is a short drive from most Pitt Meadows neighbourhoods — whether you're coming from the town centre, Highway 7, or the airport and industrial area.",
      "Because our physiotherapists, RMTs, chiropractor, kinesiologist, and acupuncturist all work from the same clinic, Pitt Meadows patients can get assessed and start treatment without being bounced between separate offices in two different cities.",
    ],
    servicesIntro:
      "Between dyke-trail running, cycling, and daily commuting along the Lougheed Highway, these are the services Pitt Meadows patients ask for most.",
    gettingHere:
      "From Pitt Meadows, most routes into Maple Ridge run along the Lougheed Highway or Dewdney Trunk Road before turning onto 238B Street — a short drive without needing to cross through Maple Ridge town centre traffic.",
    commonlyBooked: [
      "physiotherapy-maple-ridge",
      "icbc-physio-maple-ridge",
      "massage-therapy-maple-ridge",
      "kinesiology-active-rehab-maple-ridge",
    ],
  },
  {
    slug: "albion",
    name: "Albion",
    heroTitle: "Physiotherapy & Multidisciplinary Clinic Near Albion, Maple Ridge",
    heroSubtitle:
      "Serving Albion families with physiotherapy, massage therapy, chiropractic, kinesiology, and acupuncture at our 238B Street clinic in Maple Ridge.",
    metaTitle: "Physiotherapy Near Albion, Maple Ridge | {brand}",
    metaDescription:
      "{brand} is the multidisciplinary clinic near Albion, Maple Ridge for physiotherapy, massage, kinesiology, chiropractic, and more. Book online today.",
    introTitle: "Your neighbourhood team for a growing community.",
    intro: [
      "Albion is one of Maple Ridge's fastest-growing neighbourhoods, stretching east along 240th Street toward Kanaka Creek Regional Park and filling in with new townhomes, single-family subdivisions, and young families. As Albion keeps growing, so does the need for local healthcare that doesn't mean a long drive across town.",
      "Our clinic sits a short drive from Albion via Dewdney Trunk Road or 240th Street. Because we bring physiotherapy, massage therapy, chiropractic, kinesiology, and acupuncture together under one roof, Albion families can often coordinate more than one type of care in the same visit window instead of driving to multiple clinics.",
    ],
    servicesIntro:
      "With so many young families and kids in weekend sports, these are the services Albion residents book most often.",
    gettingHere:
      "Albion connects to our clinic via 240th Street or Dewdney Trunk Road — a short drive south into the 238B Street area, with no need to detour through downtown Maple Ridge.",
    commonlyBooked: [
      "physiotherapy-maple-ridge",
      "kinesiology-active-rehab-maple-ridge",
      "massage-therapy-maple-ridge",
      "chiropractor-maple-ridge",
    ],
  },
  {
    slug: "silver-valley",
    name: "Silver Valley",
    heroTitle: "Physiotherapy & Multidisciplinary Clinic Near Silver Valley",
    heroSubtitle:
      "{brand} supports Silver Valley's active, trail-going community with physiotherapy, chiropractic, kinesiology, massage therapy, and acupuncture.",
    metaTitle: "Physiotherapy Near Silver Valley, Maple Ridge | {brand}",
    metaDescription:
      "Multidisciplinary clinic near Silver Valley offering physiotherapy, chiropractic, kinesiology, and massage for hikers, riders, and families. Book with {brand}.",
    introTitle: "Trail-ready care for a hillside community.",
    intro: [
      "Silver Valley sits in the north end of Maple Ridge, climbing toward Golden Ears Provincial Park and the Alouette River, with an extensive trail network for hiking, mountain biking, and trail running right out the front door of many homes. It's also one of Maple Ridge's newer hillside neighbourhoods, built with plenty of stairs and slopes of its own.",
      "That combination — an active outdoor community on hilly terrain — means our physiotherapists, chiropractor, and kinesiologist see a steady mix of trail-related injuries and everyday strain from Silver Valley residents. Our clinic is a short drive down the hill via 232nd Street or Silver Valley Road to 238B Street.",
    ],
    servicesIntro:
      "From trail mishaps to hillside-home strain, here's what Silver Valley residents come in for most.",
    gettingHere:
      "Most Silver Valley routes head down 232nd Street or Silver Valley Road toward Dewdney Trunk Road — a short drive to our 238B Street clinic.",
    commonlyBooked: [
      "physiotherapy-maple-ridge",
      "chiropractor-maple-ridge",
      "kinesiology-active-rehab-maple-ridge",
      "massage-therapy-maple-ridge",
    ],
  },
  {
    slug: "websters-corners",
    name: "Websters Corners",
    heroTitle: "Physiotherapy & Multidisciplinary Clinic Near Websters Corners",
    heroSubtitle:
      "{brand} offers Websters Corners residents physiotherapy, chiropractic, massage therapy, and ICBC treatment support without a drive into Metro Vancouver.",
    metaTitle: "Physiotherapy Near Websters Corners, Maple Ridge | {brand}",
    metaDescription:
      "{brand} is a multidisciplinary clinic near Websters Corners for physiotherapy, chiropractic, massage, and ICBC treatment support. Book online today.",
    introTitle: "Multidisciplinary care without the long drive into town.",
    intro: [
      "Websters Corners is a rural, acreage-style community in east Maple Ridge along Dewdney Trunk Road toward Whonnock, with roots in farming and forestry that still shape the area today. Longer driveways and gravel roads are part of daily life out here, so residents are used to travelling a little further for services — including healthcare.",
      "Our clinic is a short drive west along Dewdney Trunk Road, and we try to make that trip worthwhile: physiotherapy, chiropractic, massage therapy, kinesiology, and acupuncture are all available from the same team, so Websters Corners patients aren't making separate trips for different types of care.",
    ],
    servicesIntro:
      "Acreage work, equipment use, and highway driving all take a toll — here's what Websters Corners residents book most.",
    gettingHere:
      "From Websters Corners, Dewdney Trunk Road runs fairly directly toward Maple Ridge's town centre — a short drive to our 238B Street clinic with no need to detour through downtown.",
    commonlyBooked: [
      "chiropractor-maple-ridge",
      "physiotherapy-maple-ridge",
      "massage-therapy-maple-ridge",
      "icbc-physio-maple-ridge",
    ],
  },
];

export function getLocation(slug: string): LocationArea | undefined {
  return locations.find((l) => l.slug === slug);
}

/** Resolve a location's commonly-booked slug list into full Service objects. */
export function resolveLocationServices(slugs: string[]): Service[] {
  return slugs.map((slug) => getService(slug)).filter((s): s is Service => Boolean(s));
}

/**
 * JSON-LD Service node describing the clinic's coverage of a specific
 * community — pairs with breadcrumbSchema() from lib/schema.ts.
 */
export function locationSchema(location: LocationArea, clinicName: string = clinic.name) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Physiotherapy and multidisciplinary rehabilitation",
    name: `${clinicName} — serving ${location.name}`,
    description: withBrand(location.metaDescription, clinicName),
    url: `${SITE_URL}/locations/${location.slug}`,
    provider: {
      "@type": "MedicalClinic",
      name: clinicName,
      "@id": `${SITE_URL}/#clinic`,
    },
    areaServed: {
      "@type": "City",
      name: `${location.name}, BC`,
    },
  };
}
