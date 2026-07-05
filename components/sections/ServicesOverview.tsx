import { Section, Container } from "@/components/layout/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ServiceCard } from "@/components/cards/ServiceCard";
import { LinkButton } from "@/components/ui/Button";
import { StaggeredGrid, ScrollItem } from "@/components/motion/StaggeredGrid";
import { services } from "@/lib/site-data";

export function ServicesOverview() {
  return (
    <Section tone="white" id="services">
      <Container>
        <SectionHeading
          eyebrow="Our services"
          title="Everything your recovery needs, under one roof."
        >
          From hands-on treatment to movement-based rehab and wellness care, our team helps
          you build a clear path toward better movement and better living.
        </SectionHeading>

        <StaggeredGrid className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ScrollItem key={service.slug} as="article" className="h-full">
              <ServiceCard service={service} />
            </ScrollItem>
          ))}
        </StaggeredGrid>

        <div className="mt-10">
          <LinkButton href="/services" variant="secondary">
            View all services
          </LinkButton>
        </div>
      </Container>
    </Section>
  );
}
