import { PageHero } from "@/components/layout/PageHero";
import { Section, Container } from "@/components/layout/Section";
import { TestimonialCard } from "@/components/cards/TestimonialCard";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { StaggeredGrid, ScrollItem } from "@/components/motion/StaggeredGrid";
import { JsonLd } from "@/components/ui/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { testimonials } from "@/lib/site-data";
import { buildPageMetadata } from "@/lib/seo";
import { BookButton } from "@/components/ui/BookButton";

export const generateMetadata = () => buildPageMetadata({
  title: "Patient Reviews & Testimonials | {brand} Maple Ridge",
  description:
    "Read what patients across Maple Ridge say about their care at {brand} — physiotherapy, massage, chiropractic, kinesiology, and acupuncture.",
  path: "/testimonials",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Testimonials", path: "/testimonials" },
];

export default function TestimonialsPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <PageHero
        title="Trusted by patients across Maple Ridge."
        subtitle="Real words from people we've had the privilege to help. We're grateful for every story."
        crumbs={crumbs}
        actions={<BookButton label="Book an Appointment" size="lg" withIcon source="testimonials_hero" />}
      />

      <Section tone="white">
        <Container>
          {/* Verify review permission/source before launch (flagged in content). */}
          <StaggeredGrid className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <ScrollItem key={t.name} as="div" className="h-full">
                <TestimonialCard testimonial={t} />
              </ScrollItem>
            ))}
          </StaggeredGrid>
        </Container>
      </Section>

      <FinalCTA source="testimonials_final" />
    </>
  );
}
