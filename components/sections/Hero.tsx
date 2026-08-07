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
import { trackEvent } from "@/lib/analytics";

/**
 * Positions are per-card rather than evenly spaced, because they have to work
 * around the runner in the hero image. The previous even spacing was fine
 * over the old sparse illustration but laid the third card across her legs.
 * These sit in the emptier corners: high-left above her leading arm, mid-right
 * beside her hip, and low-left clear of her trailing foot.
 */
const floatingCards = [
  { icon: CalendarCheck, label: "Same-week appointments", top: "6%", side: "left" as const },
  { icon: ShieldCheck, label: "ICBC treatment support", top: "44%", side: "right" as const },
  { icon: Users, label: "Physio • RMT • Chiro • Acupuncture", top: "90%", side: "left" as const },
];

/**
 * The hero artwork already has treatment points marked on the runner's
 * shoulder, hip, knee and both feet. These are those same points, as
 * percentages of the image, so a soft ring can pulse outward from each one —
 * the assessment reading the body, rather than decoration floating on top.
 *
 * Positions are tied to this specific image. The frame is 4:5 and so is the
 * artwork, so `object-cover` never crops and the coordinates stay true at
 * every screen size. Replacing the image means re-measuring these.
 */
const treatmentPoints = [
  { left: "51.5%", top: "27.9%", delay: 0 },
  { left: "51.2%", top: "53.3%", delay: 0.8 },
  { left: "77.3%", top: "67.4%", delay: 1.6 },
  { left: "58.4%", top: "86.2%", delay: 2.4 },
  { left: "13.2%", top: "91.1%", delay: 3.2 },
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
                    onClick={() =>
                      trackEvent("service_card_click", {
                        source: "hero_strip",
                        service: service.slug,
                      })
                    }
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
            <div className="relative h-full w-full overflow-hidden rounded-[28px]">
              <motion.img
                src="/images/hero/hero-runner.webp"
                alt="A runner mid-stride, with her shoulder, hip, knee and ankles highlighted as treatment points"
                width={1216}
                height={1520}
                // Above the fold, so it loads eagerly and is fetched early
                // rather than waiting its turn behind other page requests.
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="h-full w-full object-cover"
                initial={reduced ? false : { scale: 1.06 }}
                animate={
                  reduced
                    ? {}
                    : {
                        scale: 1,
                        // A long, shallow drift so the figure keeps a sense of
                        // motion without ever reading as a bouncing animation.
                        y: [0, -8, 0],
                      }
                }
                transition={{
                  scale: { duration: 1.6, ease: easePremium },
                  y: { duration: 9, ease: "easeInOut", repeat: Infinity, delay: 1.6 },
                }}
              />

              {/* Treatment points pulsing in sequence, head to foot. */}
              {!reduced &&
                treatmentPoints.map((point) => (
                  <motion.span
                    key={`${point.left}-${point.top}`}
                    aria-hidden="true"
                    className="pointer-events-none absolute h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-deep-teal/50"
                    style={{ left: point.left, top: point.top }}
                    initial={{ scale: 0.45, opacity: 0 }}
                    animate={{ scale: [0.45, 1.9], opacity: [0, 0.5, 0] }}
                    transition={{
                      duration: 4,
                      ease: "easeOut",
                      repeat: Infinity,
                      // Total cycle is 4s of ring plus 4s of rest, so the
                      // sequence reads as a slow sweep rather than a strobe.
                      repeatDelay: 4,
                      delay: point.delay,
                      times: [0, 0.35, 1],
                    }}
                  />
                ))}
            </div>
          </div>

          {floatingCards.map((card, i) => (
            <motion.div
              key={card.label}
              className="glass absolute rounded-2xl px-4 py-3"
              style={{
                top: card.top,
                [card.side]: "-7%",
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
