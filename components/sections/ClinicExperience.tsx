import { Section, Container } from "@/components/layout/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

/**
 * Clinic experience collage. Placeholders now — swap in real clinic photos.
 * TODO(assets): add reception, treatment room, and rehab-area photos to
 * /public/images/clinic and replace the placeholder tiles below.
 */
const tiles = [
  { label: "Reception & waiting area", span: "sm:col-span-2 sm:row-span-2" },
  { label: "Treatment room", span: "" },
  { label: "Rehab & exercise area", span: "" },
];

export function ClinicExperience() {
  return (
    <Section tone="white">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <SectionHeading
            eyebrow="The experience"
            title="A calm, modern clinic designed around your recovery."
          >
            From your first visit to your ongoing recovery plan, our space is designed to
            feel welcoming, organized, and supportive.
          </SectionHeading>

          <ScrollReveal className="grid grid-cols-2 gap-4">
            {tiles.map((tile) => (
              <div
                key={tile.label}
                className={`flex aspect-square items-center justify-center rounded-card bg-gradient-to-br from-sage to-mint/30 p-4 text-center ${tile.span}`}
              >
                <span className="font-heading text-xs font-semibold uppercase tracking-[0.16em] text-charcoal/40">
                  {tile.label}
                </span>
              </div>
            ))}
          </ScrollReveal>
        </div>
      </Container>
    </Section>
  );
}
