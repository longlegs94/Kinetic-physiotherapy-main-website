import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Printer,
  Clock,
  ExternalLink,
  ClipboardList,
  Navigation,
  ParkingCircle,
} from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { Section, Container } from "@/components/layout/Section";
import { ContactForm } from "@/components/cards/ContactForm";
import { JsonLd } from "@/components/ui/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { clinic, phoneHref, emailHref } from "@/lib/site-data";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Contact & Location | Kinetic Therapy Clinic Maple Ridge",
  description:
    "Contact Kinetic Therapy Clinic in Maple Ridge. Find our address, phone, email, and hours, or send us a message and we'll help guide you to the right care.",
  path: "/contact",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Contact", path: "/contact" },
];

// Google's canonical address format for the clinic's pin — keep as-is so the
// link lands on the exact listing rather than a fuzzy search result.
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  "12005 238b St #103, Maple Ridge, BC V4R 1W1"
)}`;

export default function ContactPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <PageHero
        title="Get in touch."
        subtitle="Book online anytime through Jane, call us directly, or send a message below and we'll help guide you to the right type of care."
        crumbs={crumbs}
      />

      <Section tone="white">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
            {/* Details */}
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold text-charcoal">Visit the clinic</h2>
                <ul className="mt-4 space-y-4 text-charcoal/80">
                  <li className="flex gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-deep-teal" aria-hidden="true" />
                    <span>{clinic.address}</span>
                  </li>
                  <li className="flex gap-3">
                    <Phone className="mt-0.5 h-5 w-5 shrink-0 text-deep-teal" aria-hidden="true" />
                    <a href={phoneHref} className="hover:text-deep-teal">
                      {clinic.phone}
                    </a>
                  </li>
                  <li className="flex gap-3">
                    <Mail className="mt-0.5 h-5 w-5 shrink-0 text-deep-teal" aria-hidden="true" />
                    <a href={emailHref} className="break-all hover:text-deep-teal">
                      {clinic.email}
                    </a>
                  </li>
                  {clinic.fax && (
                    <li className="flex gap-3">
                      <Printer className="mt-0.5 h-5 w-5 shrink-0 text-deep-teal" aria-hidden="true" />
                      <span>Fax: {clinic.fax}</span>
                    </li>
                  )}
                </ul>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-1.5 rounded-pill border border-deep-teal/30 bg-sage/40 px-4 py-2 text-sm font-semibold text-deep-teal transition-colors hover:border-deep-teal"
                >
                  Open in Google Maps
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>

              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold text-charcoal">
                  <Navigation className="h-5 w-5 text-deep-teal" aria-hidden="true" />
                  Getting here
                </h2>
                <ul className="mt-4 space-y-3 text-sm text-charcoal/70">
                  <li className="flex gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-deep-teal" aria-hidden="true" />
                    <span>
                      We&apos;re in the Cottonwood / 238B Street area of Maple Ridge, just off
                      Dewdney Trunk Road — a short drive from Maple Ridge town centre, serving
                      Maple Ridge, Pitt Meadows, and the surrounding communities.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <ParkingCircle className="mt-0.5 h-4 w-4 shrink-0 text-deep-teal" aria-hidden="true" />
                    {/* TODO(verify): confirm parking details with clinic */}
                    <span>Parking is available at the unit.</span>
                  </li>
                </ul>
                <p className="mt-3 text-xs text-charcoal/70">
                  Service area: Maple Ridge, Pitt Meadows, Albion, Websters Corners, and
                  Whonnock.
                </p>
              </div>

              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold text-charcoal">
                  <Clock className="h-5 w-5 text-deep-teal" aria-hidden="true" />
                  Hours
                </h2>
                <ul className="mt-4 divide-y divide-silver/60 rounded-card border border-silver/60 bg-warm-white">
                  {clinic.hours.map((h) => (
                    <li key={h.days} className="flex justify-between gap-4 px-5 py-3 text-sm">
                      <span className="font-medium text-charcoal">{h.days}</span>
                      <span className="text-charcoal/70">{h.hours}</span>
                    </li>
                  ))}
                </ul>
                {/* Hours flagged needsVerification in content — confirm before launch. */}
                <p className="mt-2 text-xs text-charcoal/70">
                  Please confirm current hours when booking.
                </p>
              </div>

              <div className="glass rounded-card p-5">
                <h2 className="font-bold text-charcoal">Coming in for your first visit?</h2>
                <p className="mt-1.5 text-sm text-charcoal/65">
                  Save time at the front desk — fill out our pre-visit intake and
                  we&apos;ll have your summary ready.
                </p>
                <Link
                  href="/intake"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-pill border border-deep-teal/30 bg-sage/40 px-4 py-2 text-sm font-semibold text-deep-teal transition-colors hover:border-deep-teal"
                >
                  <ClipboardList className="h-4 w-4" aria-hidden="true" />
                  Start pre-visit intake
                </Link>
              </div>
            </div>

            {/* Form */}
            <div className="rounded-panel border border-silver/60 bg-warm-white p-6 shadow-card sm:p-8">
              <h2 className="text-xl font-bold text-charcoal">Send us a message</h2>
              <p className="mt-1.5 text-sm text-charcoal/70">
                For bookings, the fastest option is Jane online booking — but we&apos;re happy
                to help with any question.
              </p>
              <div className="mt-6">
                <ContactForm />
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
