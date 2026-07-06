import { Quote } from "lucide-react";
import { Section, Container } from "@/components/layout/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TestimonialCard } from "@/components/cards/TestimonialCard";
import { StaggeredGrid, ScrollItem } from "@/components/motion/StaggeredGrid";
import { KineticMotionLine } from "@/components/motion/KineticMotionLine";
import { testimonials } from "@/lib/site-data";

export function TestimonialsSection() {
  return (
    <Section tone="charcoal" id="testimonials" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-charcoal via-soft-black to-deep-teal/40"
      />
      <KineticMotionLine className="absolute inset-x-0 top-6 h-20 opacity-25" />
      <Container className="relative">
        <Quote className="relative mx-auto h-12 w-12 text-mint" aria-hidden="true" />
        <SectionHeading
          eyebrow="Patient stories"
          title="Trusted by patients across Maple Ridge."
          align="center"
          tone="dark"
        />
        <StaggeredGrid className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <ScrollItem key={t.name} as="div" className="h-full">
              <TestimonialCard testimonial={t} tone="dark" />
            </ScrollItem>
          ))}
        </StaggeredGrid>
        {/* Verify review permission/source before launch (flagged in content). */}
      </Container>
    </Section>
  );
}
