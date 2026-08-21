"use client";

import { motion } from "framer-motion";
import { Section, Container } from "@/components/layout/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { useClinic } from "@/components/providers/SiteDataProvider";
import { viewportOnce, easePremium } from "@/lib/motion";

const nodes = [
  "Physio",
  "RMT",
  "Chiro",
  "Kinesiology",
  "Acupuncture",
  "Orthotics / Bracing",
];

/** Circular care diagram: nodes orbit a central "Your Recovery Plan" hub. */
export function MultidisciplinaryAdvantage() {
  const reduced = useReducedMotionSafe();
  const clinic = useClinic();
  const radius = 140;
  const center = 170;

  return (
    <Section tone="charcoal">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <SectionHeading
            eyebrow="The Kinetic advantage"
            tone="dark"
            title="One clinic. Multiple experts. Better continuity of care."
          >
            Instead of bouncing between separate clinics, {clinic.name} brings multiple
            disciplines together so your care can feel more connected, convenient, and
            complete.
          </SectionHeading>

          <div className="mx-auto w-full max-w-[340px]">
            <div className="relative aspect-square">
              {/* orbit ring */}
              <svg
                viewBox="0 0 340 340"
                className="absolute inset-0 h-full w-full"
                aria-hidden="true"
              >
                <motion.circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke="#72E0C0"
                  strokeOpacity="0.35"
                  strokeWidth="1.5"
                  strokeDasharray="4 6"
                  initial={reduced ? { pathLength: 1 } : { pathLength: 0, rotate: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={viewportOnce}
                  transition={{ duration: 1.2, ease: easePremium }}
                />
              </svg>

              {/* center hub */}
              <motion.div
                className="absolute left-1/2 top-1/2 z-10 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-mint text-center shadow-dark-glow"
                initial={reduced ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={viewportOnce}
                transition={{ delay: 0.7, duration: 0.5, ease: easePremium }}
              >
                <span className="px-3 text-sm font-bold leading-tight text-charcoal">
                  Your Recovery Plan
                </span>
              </motion.div>

              {/* orbiting nodes */}
              {nodes.map((node, i) => {
                const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
                const x = center + radius * Math.cos(angle);
                const y = center + radius * Math.sin(angle);
                return (
                  <motion.div
                    key={node}
                    className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-pill border border-mint/40 bg-soft-black px-3 py-1.5 text-xs font-semibold text-warm-white transition-shadow duration-200 hover:shadow-button-hover hover:border-mint"
                    style={{
                      left: `${(x / 340) * 100}%`,
                      top: `${(y / 340) * 100}%`,
                    }}
                    initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.6 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={viewportOnce}
                    transition={{
                      delay: reduced ? 0 : 0.2 + i * 0.12,
                      duration: 0.4,
                      ease: easePremium,
                    }}
                  >
                    {node}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
