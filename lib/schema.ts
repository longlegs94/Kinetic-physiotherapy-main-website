import { clinic as bundledClinic, type Clinic, type Service, type Faq } from "./site-data";
import { SITE_URL } from "./seo";

/**
 * JSON-LD structured data builders. Rendered via <script type="application/ld+json">.
 * Only include facts that are verified — coverage/hours flagged needsVerification
 * in content should be confirmed by the owner before launch.
 */

const geo = {
  // TODO(verify): confirm exact coordinates for #103 – 12005 238b Street, Maple Ridge.
  latitude: 49.2189,
  longitude: -122.601,
};

/**
 * The clinic's structured data, built from live values.
 *
 * Takes the clinic as an argument rather than importing it: this block is what
 * Google reads for the phone number, address and opening hours, so it has to
 * reflect what the portal last saved, not what was true at build time.
 */
export function localBusinessSchema(clinic: Clinic, janeBookingUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    "@id": `${SITE_URL}/#clinic`,
    name: clinic.name,
    description: clinic.positioning,
    url: SITE_URL,
    telephone: clinic.phone,
    email: clinic.email,
    faxNumber: clinic.fax,
    address: {
      "@type": "PostalAddress",
      streetAddress: "#103 – 12005 238b Street",
      addressLocality: clinic.city,
      addressRegion: clinic.province,
      postalCode: "V4R 1W1",
      addressCountry: clinic.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: geo.latitude,
      longitude: geo.longitude,
    },
    image: `${SITE_URL}/opengraph-image`,
    sameAs: [clinic.socials?.facebook, clinic.socials?.instagram].filter(Boolean),
    priceRange: "$$",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "20:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "09:00",
        closes: "15:00",
      },
    ],
    medicalSpecialty: "Physiotherapy",
    availableService: [
      "Physiotherapy",
      "Massage Therapy",
      "Chiropractic",
      "Kinesiology",
      "Acupuncture",
    ],
    potentialAction: {
      "@type": "ReserveAction",
      target: janeBookingUrl,
      name: "Book an Appointment",
    },
  };
}

export function serviceSchema(service: Service) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalTherapy",
    name: service.name,
    description: service.description,
    url: `${SITE_URL}/${service.slug}`,
    provider: {
      "@type": "MedicalClinic",
      name: bundledClinic.name,
      "@id": `${SITE_URL}/#clinic`,
    },
    areaServed: {
      "@type": "City",
      name: `${bundledClinic.city}, ${bundledClinic.province}`,
    },
  };
}

export function faqSchema(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
