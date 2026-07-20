import { Section, Container } from "@/components/layout/Section";
import { BookButton } from "@/components/ui/BookButton";
import { CallButton } from "@/components/ui/CallButton";
import { KineticMotionLine } from "@/components/motion/KineticMotionLine";

/** Repeatable closing call-to-action band. Dark, high-contrast. */
export function FinalCTA({
  title = "Ready to start feeling better?",
  copy = "Book online in minutes, or contact our team if you're not sure which service is right for you.",
  source = "final_cta",
}: {
  title?: string;
  copy?: string;
  source?: string;
}) {
  return (
    <Section tone="charcoal" className="relative overflow-hidden">
      <KineticMotionLine className="absolute inset-x-0 top-8 h-24 opacity-30" />
      <Container className="relative">
        <div className="glass-dark relative overflow-hidden rounded-panel px-6 py-14 text-center sm:px-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mint/20 blur-3xl"
          />
          <h2 className="relative mx-auto max-w-3xl text-section-h2 font-bold text-warm-white">
            {title}
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-warm-white/75">
            {copy}
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <BookButton label="Book Now" size="lg" withIcon source={source} />
            <CallButton variant="secondary-dark" size="lg" source={source} />
          </div>
        </div>
      </Container>
    </Section>
  );
}
