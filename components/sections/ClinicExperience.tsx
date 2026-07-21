import { Section, Container } from "@/components/layout/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

/**
 * Clinic experience collage. Illustrations are placeholders now — swap in
 * real clinic photography.
 * TODO(assets): add reception, treatment room, and rehab-area photos to
 * /public/images/clinic and replace the illustration tiles below.
 */
const tiles = [
  {
    label: "Reception & waiting area",
    src: "/images/illustrations/clinic-reception.svg",
    span: "sm:col-span-2 sm:row-span-2",
  },
  {
    label: "Treatment room",
    src: "/images/illustrations/clinic-treatment.svg",
    span: "",
  },
  {
    label: "Rehab & exercise area",
    src: "/images/illustrations/clinic-rehab.svg",
    span: "",
  },
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
              <div key={tile.label} className={`glass overflow-hidden rounded-card p-1.5 ${tile.span}`}>
                <div className="aspect-square overflow-hidden rounded-[22px]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local SVG; next/image adds no optimization for SVGs */}
                  <img
                    src={tile.src}
                    alt={`Illustration of the ${tile.label.toLowerCase()}`}
                    className="h-full w-full rounded-[22px] object-cover"
                    loading="lazy"
                  />
                </div>
                <span className="block px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.14em] text-charcoal/70">
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
