import { Section, Container } from "@/components/layout/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FAQAccordion } from "@/components/cards/FAQAccordion";
import type { Faq } from "@/lib/site-data";

export function FAQSection({
  faqs,
  title = "Common questions before booking.",
  eyebrow = "FAQ",
}: {
  faqs: Faq[];
  title?: string;
  eyebrow?: string;
}) {
  return (
    <Section tone="white" id="faq">
      <Container className="max-w-3xl">
        <SectionHeading eyebrow={eyebrow} title={title} align="center" />
        <div className="mt-10">
          <FAQAccordion faqs={faqs} />
        </div>
      </Container>
    </Section>
  );
}
