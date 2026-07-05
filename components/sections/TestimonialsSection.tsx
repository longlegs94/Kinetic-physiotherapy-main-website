import { Section, Container } from "@/components/layout/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TestimonialCard } from "@/components/cards/TestimonialCard";
import { StaggeredGrid, ScrollItem } from "@/components/motion/StaggeredGrid";
import { testimonials } from "@/lib/site-data";

export function TestimonialsSection() {
  return (
    <Section tone="warm" id="testimonials">
      <Container>
        <SectionHeading
          eyebrow="Patient stories"
          title="Trusted by patients across Maple Ridge."
          align="center"
        />
        <StaggeredGrid className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <ScrollItem key={t.name} as="div" className="h-full">
              <TestimonialCard testimonial={t} />
            </ScrollItem>
          ))}
        </StaggeredGrid>
        {/* Verify review permission/source before launch (flagged in content). */}
      </Container>
    </Section>
  );
}
