import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, ParkingCircle, ShieldCheck, ArrowRight } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { Section, Container } from "@/components/layout/Section";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BookButton } from "@/components/ui/BookButton";
import { CallButton } from "@/components/ui/CallButton";
import { TrustBadges } from "@/components/ui/TrustBadges";
import { ServiceCard } from "@/components/cards/ServiceCard";
import { PractitionerCard } from "@/components/cards/PractitionerCard";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { StaggeredGrid, ScrollItem } from "@/components/motion/StaggeredGrid";
import { JsonLd } from "@/components/ui/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { locations, getLocation, resolveLocationServices, locationSchema } from "@/content/locations";
import { getClinic, getPractitioners } from "@/lib/content/store";

export const dynamicParams = false;

export function generateStaticParams() {
  return locations.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const location = getLocation(slug);
  if (!location) return {};
  return pageMetadata({
    title: location.metaTitle,
    description: location.metaDescription,
    path: `/locations/${slug}`,
  });
}

export default async function LocationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const practitioners = await getPractitioners();
  const clinic = await getClinic();
  const { slug } = await params;
  const location = getLocation(slug);
  if (!location) notFound();

  const commonServices = resolveLocationServices(location.commonlyBooked);
  const relevantPractitioners = practitioners.filter((p) =>
    commonServices.some(
      (s) =>
        p.category.toLowerCase().includes(s.shortName.toLowerCase()) ||
        s.name.toLowerCase().includes(p.category.toLowerCase())
    )
  );

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Service Areas", path: "/locations" },
    { name: location.name, path: `/locations/${slug}` },
  ];

  return (
    <>
      <JsonLd data={[locationSchema(location), breadcrumbSchema(crumbs)]} />

      <PageHero
        title={location.heroTitle}
        subtitle={location.heroSubtitle}
        crumbs={crumbs}
        actions={
          <>
            <BookButton label="Book Now" size="lg" withIcon source={`location:${slug}`} />
            <CallButton variant="secondary" size="lg" />
          </>
        }
      >
        <div className="mt-8">
          <TrustBadges />
        </div>
      </PageHero>

      {/* Intro */}
      <Section tone="white">
        <Container className="max-w-3xl">
          <SectionHeading eyebrow={`Serving ${location.name}`} title={location.introTitle} />
          <div className="mt-6 space-y-4 leading-relaxed text-charcoal/80">
            {location.intro.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </Container>
      </Section>

      {/* Commonly booked services */}
      <Section tone="sage">
        <Container>
          <SectionHeading
            eyebrow="Popular in your area"
            title={`What ${location.name} patients book most.`}
          >
            {location.servicesIntro}
          </SectionHeading>
          <StaggeredGrid className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {commonServices.map((s) => (
              <ScrollItem key={s.slug} as="article" className="h-full">
                <ServiceCard service={s} />
              </ScrollItem>
            ))}
          </StaggeredGrid>
          <div className="mt-8">
            <Link
              href="/services"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-deep-teal hover:text-charcoal"
            >
              View all services
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </Container>
      </Section>

      {/* ICBC note */}
      <Section tone="white">
        <Container className="max-w-3xl">
          <div className="rounded-card border border-silver/60 bg-sage/30 p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-deep-teal" aria-hidden="true" />
              <div>
                <h2 className="text-xl font-bold text-charcoal">
                  Injured in a motor vehicle accident?
                </h2>
                <p className="mt-2 leading-relaxed text-charcoal/75">
                  If you have an active ICBC claim, you may be able to access up to 12 weeks
                  of treatment — such as physiotherapy, massage, kinesiology, chiropractic,
                  and acupuncture — though conditions and eligibility apply. Our team can
                  help {location.name} residents understand their options and get a recovery
                  plan started.
                </p>
                <Link
                  href="/icbc-physio-maple-ridge"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-deep-teal hover:text-charcoal"
                >
                  Learn about ICBC treatment support
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Getting here / parking */}
      <Section tone="charcoal">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <SectionHeading eyebrow="Getting here" tone="dark" title={`From ${location.name} to our door.`}>
              {location.gettingHere}
            </SectionHeading>
            <div className="space-y-4 text-warm-white/80">
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-mint" aria-hidden="true" />
                <span>{clinic.address}</span>
              </div>
              <div className="flex gap-3">
                <ParkingCircle className="mt-0.5 h-5 w-5 shrink-0 text-mint" aria-hidden="true" />
                {/* TODO(verify): confirm parking details with clinic */}
                <span>Free parking is available at the unit.</span>
              </div>
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <BookButton
                  label="Book Now"
                  size="lg"
                  withIcon
                  source={`location_getting_here:${slug}`}
                />
                <CallButton variant="secondary-dark" size="lg" />
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Practitioner preview */}
      {relevantPractitioners.length > 0 && (
        <Section tone="warm">
          <Container>
            <SectionHeading
              eyebrow="Your team"
              title="Practitioners who commonly see patients from this area."
            />
            <StaggeredGrid className="mt-10 grid grid-cols-1 items-start gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {relevantPractitioners.slice(0, 4).map((p) => (
                <ScrollItem key={p.name} as="div">
                  <PractitionerCard practitioner={p} />
                </ScrollItem>
              ))}
            </StaggeredGrid>
          </Container>
        </Section>
      )}

      {/* Contact link */}
      <Section tone="white">
        <Container className="max-w-3xl text-center">
          <p className="text-charcoal/70">
            Not sure where to start?{" "}
            <Link href="/contact" className="font-semibold text-deep-teal hover:text-charcoal">
              Contact our team
            </Link>{" "}
            and we&apos;ll help guide you to the right type of care.
          </p>
        </Container>
      </Section>

      <FinalCTA
        title={`Ready to book from ${location.name}?`}
        copy="Book online in minutes, or call the clinic and our team will help you get started."
        source={`location_final:${slug}`}
      />
    </>
  );
}
