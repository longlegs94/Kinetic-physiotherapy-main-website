import { Section, Container } from "@/components/layout/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FAQAccordion } from "@/components/cards/FAQAccordion";
import { AskAssistantButton } from "@/components/concierge/AskAssistantButton";
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
        <div className="mt-8 flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-charcoal/70">
            Didn&apos;t find your answer?
          </p>
          <AskAssistantButton />
        </div>
      </Container>
    </Section>
  );
}
