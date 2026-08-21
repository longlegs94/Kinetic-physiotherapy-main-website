import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { Section, Container } from "@/components/layout/Section";
import { JsonLd } from "@/components/ui/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { buildPageMetadata } from "@/lib/seo";
import { locations } from "@/content/locations";

export const generateMetadata = () => buildPageMetadata({
  title: "Service Areas | {brand} Maple Ridge",
  description:
    "{brand} on 238B Street serves Maple Ridge and neighbouring communities including Pitt Meadows, Albion, Silver Valley, and Websters Corners.",
  path: "/locations",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Service Areas", path: "/locations" },
];

export default function LocationsIndexPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <PageHero
        title="Communities we serve near Maple Ridge."
        subtitle="Our multidisciplinary clinic at #103 – 12005 238B Street is a short drive from these neighbouring communities. Find the page for your area below to see the driving context, services locals book most, and how to get started."
        crumbs={crumbs}
      />

      <Section tone="white">
        <Container>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {locations.map((location) => (
              <Link
                key={location.slug}
                href={`/locations/${location.slug}`}
                className="group flex h-full flex-col rounded-card glass p-6 transition-all duration-200 ease-premium hover:-translate-y-1 hover:border-mint"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sage/70 text-deep-teal transition-colors group-hover:bg-mint group-hover:text-charcoal">
                  <MapPin className="h-6 w-6" aria-hidden="true" />
                </span>
                <h2 className="mt-5 text-card-title font-bold text-charcoal">
                  {location.name}
                </h2>
                <p className="mt-2 flex-1 text-[15px] leading-relaxed text-charcoal/70">
                  {location.introTitle}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-deep-teal">
                  View {location.name} page
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
