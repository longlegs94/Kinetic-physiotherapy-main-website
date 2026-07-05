import { Section, Container } from "@/components/layout/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PainPointSelector } from "@/components/cards/PainPointSelector";
import { NotSureCTA } from "@/components/ui/NotSureCTA";

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
