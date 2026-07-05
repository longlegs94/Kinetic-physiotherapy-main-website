"use client";

import { motion } from "framer-motion";
import { CalendarCheck, ShieldCheck, Users } from "lucide-react";
import { Container } from "@/components/layout/Section";
import { BookButton } from "@/components/ui/BookButton";
import { LinkButton } from "@/components/ui/Button";
import { TrustBadges } from "@/components/ui/TrustBadges";
import { KineticMotionLine } from "@/components/motion/KineticMotionLine";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { homepage } from "@/lib/site-data";
import { heroLine, easePremium } from "@/lib/motion";

const floatingCards = [
  { icon: CalendarCheck, label: "Same-week appointments" },
  { icon: ShieldCheck, label: "ICBC treatment support" },
  { icon: Users, label: "Physio • RMT • Chiro • Acupuncture" },
];

export function Hero() {
  const { hero } = homepage;
  const reduced = useReducedMotionSafe();

  const container = reduced
    ? {}
    : {
        initial: "hidden" as const,
        animate: "visible" as const,
        transition: { staggerChildren: 0.12 },
      };

  return (
    <section className="relative overflow-hidden bg-warm-white pt-28 pb-16 sm:pt-32 md:pt-36 md:pb-24">
      {/* soft ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-20 h-[520px] w-[520px] rounded-full bg-mint/20 blur-3xl"
      />
      <KineticMotionLine className="absolute inset-x-0 bottom-0 h-32 opacity-50" />

      <Container className="relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Left: copy */}
        <motion.div {...container}>
          <motion.span
            variants={reduced ? undefined : heroLine}
            className="inline-block rounded-pill bg-sage/70 px-4 py-1.5 text-sm font-semibold text-deep-teal"
          >
            {hero.eyebrow}
          </motion.span>

          <h1 className="mt-5 text-hero-lg font-extrabold text-charcoal">
            {hero.titleLines.map((line, i) => (
              <motion.span
                key={line}
                variants={reduced ? undefined : heroLine}
                className="block"
              >
                {i === hero.titleLines.length - 1 ? (
                  <span>
                    Live <span className="text-deep-teal">pain-free.</span>
                  </span>
                ) : (
                  line
                )}
              </motion.span>
            ))}
          </h1>

          <motion.p
            variants={reduced ? undefined : heroLine}
            className="mt-6 max-w-xl text-lg leading-relaxed text-charcoal/70"
          >
            {hero.subtitle}
          </motion.p>

          <motion.div
            variants={reduced ? undefined : heroLine}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <BookButton label={hero.primaryCta} size="lg" withIcon source="hero" />
            <LinkButton href="/services" variant="secondary" size="lg" withArrow={false}>
              {hero.secondaryCta}
            </LinkButton>
          </motion.div>

          <motion.div variants={reduced ? undefined : heroLine} className="mt-8">
            <TrustBadges />
          </motion.div>
        </motion.div>

        {/* Right: image + floating cards */}
        <div className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-panel bg-gradient-to-br from-sage via-mint/30 to-deep-teal/20 shadow-card">
            {/* TODO(assets): replace with real clinic hero image
                (practitioner working with a patient, warm natural light). */}
            <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
              <p className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-charcoal/40">
                Clinic hero image
              </p>
            </div>
          </div>

          {floatingCards.map((card, i) => (
            <motion.div
              key={card.label}
              className="absolute rounded-2xl border border-silver/60 bg-warm-white/95 px-4 py-3 shadow-card backdrop-blur"
              style={{
                top: `${12 + i * 34}%`,
                [i % 2 === 0 ? "left" : "right"]: "-6%",
              }}
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={
                reduced
                  ? {}
                  : {
                      opacity: 1,
                      y: [0, -8, 0],
                    }
              }
              transition={{
                opacity: { delay: 0.6 + i * 0.15, duration: 0.5 },
                y: {
                  delay: 0.6 + i * 0.15,
                  duration: 4 + i,
                  repeat: Infinity,
                  ease: easePremium,
                },
              }}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-charcoal">
                <card.icon className="h-4 w-4 text-deep-teal" aria-hidden="true" />
                {card.label}
              </span>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
