import { Section, Container } from "@/components/layout/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PainPointSelector } from "@/components/cards/PainPointSelector";
import { NotSureCTA } from "@/components/ui/NotSureCTA";
import { SymptomRouter } from "@/components/concierge/SymptomRouter";
import { aiAssistantEnabled } from "@/lib/ai-config";

export function PainPointSection() {
  return (
    <Section tone="warm" id="what-brings-you-in">
      <Container>
        <SectionHeading
          eyebrow="Start here"
          title="What brings you in today?"
          align="center"
        >
          Choose what you&apos;re dealing with and we&apos;ll guide you toward the right type of care.
        </SectionHeading>
        {/* The free-text router and the "or pick what fits" divider are one
            unit: the divider only makes sense as a second option after the
            first. Hiding the router alone would leave the label introducing
            nothing. With the assistant off, the selector below is simply the
            way to choose, and needs no preamble. */}
        {aiAssistantEnabled && (
          <>
            <div className="mt-10">
              <SymptomRouter />
            </div>
            <p className="mt-10 text-center text-sm font-semibold uppercase tracking-[0.14em] text-charcoal/70">
              or pick what fits
            </p>
          </>
        )}
        {/* Manual selector grid, for those who'd rather tap than type */}
        <div className="mt-12">
          <PainPointSelector />
        </div>
        <div className="mt-10 flex justify-center">
          <NotSureCTA />
        </div>
      </Container>
    </Section>
  );
}
