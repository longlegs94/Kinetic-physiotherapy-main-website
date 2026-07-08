"use client";

import Link from "next/link";
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

          <motion.div
            variants={reduced ? undefined : heroLine}
            className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-charcoal/60"
          >
            <div className="flex flex-wrap items-center gap-x-2">
              {[
                { name: "Physiotherapy", slug: "physiotherapy-maple-ridge" },
                { name: "Massage Therapy", slug: "massage-therapy-maple-ridge" },
                { name: "Chiropractic", slug: "chiropractor-maple-ridge" },
                { name: "Kinesiology", slug: "kinesiology-active-rehab-maple-ridge" },
                { name: "Acupuncture", slug: "acupuncture-maple-ridge" },
              ].map((service, i) => (
                <span key={service.slug} className="flex items-center gap-x-2">
                  <Link
                    href={`/${service.slug}`}
                    className="font-medium transition-colors duration-200 hover:text-mint"
                  >
                    {service.name}
                  </Link>
                  {i < 4 && <span className="text-charcoal/40">·</span>}
                </span>
              ))}
            </div>
            <span className="whitespace-nowrap text-charcoal/60">in Maple Ridge</span>
          </motion.div>

          <motion.div variants={reduced ? undefined : heroLine} className="mt-8">
            <TrustBadges />
          </motion.div>
        </motion.div>

        {/* Right: illustration in a glass frame + floating cards */}
        <div className="relative">
          <div className="glass relative aspect-[4/5] overflow-hidden rounded-panel p-2.5">
            {/* TODO(assets): swap the illustration for a real clinic hero photo
                (practitioner working with a patient, warm natural light). */}
            <motion.img
              src="/images/illustrations/hero-kinetic.svg"
              alt="Stylized figure in motion surrounded by flowing mint recovery lines"
              className="h-full w-full rounded-[28px] object-cover"
              initial={reduced ? false : { scale: 1.06 }}
              animate={reduced ? {} : { scale: 1 }}
              transition={{ duration: 1.6, ease: easePremium }}
            />
          </div>

          {floatingCards.map((card, i) => (
            <motion.div
              key={card.label}
              className="glass absolute rounded-2xl px-4 py-3"
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
