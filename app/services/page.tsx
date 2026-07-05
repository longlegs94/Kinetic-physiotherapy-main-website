import { PageHero } from "@/components/layout/PageHero";
import { Section, Container } from "@/components/layout/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ServiceCard } from "@/components/cards/ServiceCard";
import { NotSureCTA } from "@/components/ui/NotSureCTA";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { StaggeredGrid, ScrollItem } from "@/components/motion/StaggeredGrid";
import { JsonLd } from "@/components/ui/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { services, serviceCategories, getServicesByCategory } from "@/lib/site-data";
import { pageMetadata } from "@/lib/seo";
import { BookButton } from "@/components/ui/BookButton";

export const metadata = pageMetadata({
  title: "Services in Maple Ridge | Physio, Massage, Chiro, Acupuncture & More",
  description:
    "Explore Kinetic Therapy's multidisciplinary services in Maple Ridge: physiotherapy, massage therapy, chiropractic, kinesiology, acupuncture, ICBC support, pregnancy massage, shockwave, orthotics and bracing.",
  path: "/services",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Services", path: "/services" },
];

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
        subtitle="From hands-on treatment to movement-based rehab and wellness care, our team helps you build a clear path toward better movement and better living."
        crumbs={crumbs}
        actions={<BookButton label="Book an Appointment" size="lg" withIcon source="services_hero" />}
      />

      {usedCategories.map((category, idx) => (
        <Section key={category} tone={idx % 2 === 0 ? "white" : "warm"}>
          <Container>
            <SectionHeading eyebrow="Services" title={category} />
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
