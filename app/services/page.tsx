import { PageHero } from "@/components/layout/PageHero";
import { Section, Container } from "@/components/layout/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ServiceCard } from "@/components/cards/ServiceCard";
import { PainPointSelector } from "@/components/cards/PainPointSelector";
import { NotSureCTA } from "@/components/ui/NotSureCTA";
import { SymptomRouter } from "@/components/concierge/SymptomRouter";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { ICBCSection } from "@/components/sections/ICBCSection";
import { StaggeredGrid, ScrollItem } from "@/components/motion/StaggeredGrid";
import { JsonLd } from "@/components/ui/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { services, serviceCategories, getServicesByCategory } from "@/lib/site-data";
import { pageMetadata } from "@/lib/seo";
import { BookButton } from "@/components/ui/BookButton";
import { LinkButton } from "@/components/ui/Button";

export const metadata = pageMetadata({
  title: "Services in Maple Ridge — Physio, Massage, Chiro & More | Kinetic Therapy Clinic",
  description:
    "Explore Kinetic Therapy's multidisciplinary services in Maple Ridge: physiotherapy, massage therapy, chiropractic, kinesiology, acupuncture, ICBC support, pregnancy massage, shockwave, orthotics and bracing.",
  path: "/services",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Services", path: "/services" },
];

/** Short intro copy per service category, shown under each section heading. */
const categoryIntros: Record<string, string> = {
  "Rehab and Movement":
    "Rebuild strength, mobility, and confidence with assessment-driven, movement-based care.",
  "Hands-on Therapy":
    "Hands-on treatment to ease tension, support recovery, and help you feel like yourself again.",
  "Pain and Wellness":
    "Targeted options for stubborn pain, joint concerns, and whole-body wellness.",
  "Women and Family Care":
    "Supportive, comfort-focused care for pregnancy and family life.",
  "Insurance and Injury Support":
    "Guided support for ICBC and injury claims so you can focus on recovering.",
};

export default function ServicesPage() {
  // Categories that actually contain services, in intended order.
  const usedCategories = serviceCategories.filter(
    (c) => getServicesByCategory(c).length > 0
  );

  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <PageHero
        title="Everything your recovery needs, under one roof."
        subtitle="From physiotherapy and massage therapy to chiropractic, kinesiology, acupuncture, ICBC care, and recovery support — Kinetic Therapy helps you find the right treatment path without bouncing between clinics."
        crumbs={crumbs}
        actions={
          <>
            <BookButton label="Book an Appointment" size="lg" withIcon source="services_hero" />
            <LinkButton href="/contact" variant="secondary" size="lg" withArrow={false}>
              Help Me Choose a Service
            </LinkButton>
          </>
        }
      >
        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-charcoal/50">
          Physio • RMT • Chiro • Kinesiology • Acupuncture • ICBC Care
        </p>
      </PageHero>

      <Section tone="warm">
        <Container>
          <SectionHeading
            eyebrow="Start here"
            title="Not sure what service you need?"
            align="center"
          >
            Pick what you&apos;re dealing with and we&apos;ll point you to the right care
            options.
          </SectionHeading>
          <div className="mt-10">
            <SymptomRouter />
          </div>
          <p className="mt-10 text-center text-sm font-semibold uppercase tracking-[0.14em] text-charcoal/70">
            or pick what fits
          </p>
          <div className="mt-12">
            <PainPointSelector />
          </div>
        </Container>
      </Section>

      {usedCategories.map((category, idx) => (
        <Section key={category} tone={idx % 2 === 0 ? "white" : "warm"}>
          <Container>
            <SectionHeading eyebrow="Services" title={category}>
              {categoryIntros[category]}
            </SectionHeading>
            <StaggeredGrid className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {getServicesByCategory(category).map((service) => (
                <ScrollItem key={service.slug} as="article" className="h-full">
                  <ServiceCard service={service} />
                </ScrollItem>
              ))}
            </StaggeredGrid>
          </Container>
        </Section>
      ))}

      <ICBCSection />

      <Section tone="sage">
        <Container className="flex flex-col items-center gap-6 text-center">
          <p className="text-lg font-medium text-charcoal/80">
            {services.length} services and a full multidisciplinary team — but you
            don&apos;t have to figure it out alone.
          </p>
          <NotSureCTA />
        </Container>
      </Section>

      <FinalCTA source="services_final" />
    </>
  );
}
