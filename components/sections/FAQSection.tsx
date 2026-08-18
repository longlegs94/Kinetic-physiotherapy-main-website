import { Section, Container } from "@/components/layout/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FAQAccordion } from "@/components/cards/FAQAccordion";
import { AskAssistantButton } from "@/components/concierge/AskAssistantButton";
import { aiAssistantEnabled } from "@/lib/ai-config";
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
        {/* Prompt and button hide together: "Didn't find your answer?" with
            nothing beneath it is worse than omitting both. The contact page
            and phone number remain reachable from the header and footer. */}
        {aiAssistantEnabled && (
          <div className="mt-8 flex flex-col items-center gap-2 text-center">
            <p className="text-sm text-charcoal/60">
              Didn&apos;t find your answer?
            </p>
            <AskAssistantButton />
          </div>
        )}
      </Container>
    </Section>
  );
}
