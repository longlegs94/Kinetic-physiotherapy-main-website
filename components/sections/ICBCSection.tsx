"use client";

import { motion } from "framer-motion";
import { FileText, UserCheck, HeartPulse, Car } from "lucide-react";
import { Section, Container } from "@/components/layout/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BookButton } from "@/components/ui/BookButton";
import { CallButton } from "@/components/ui/CallButton";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { viewportOnce, easePremium } from "@/lib/motion";

const steps = [
  {
    icon: FileText,
    title: "Share your claim information",
    copy: "Bring your ICBC claim number and details so we can help guide your next steps.",
  },
  {
    icon: UserCheck,
    title: "Get matched with the right practitioner",
    copy: "We help direct you to physio, RMT, kinesiology, chiropractic, or acupuncture based on your needs.",
  },
  {
    icon: HeartPulse,
    title: "Start your recovery plan",
    copy: "Begin a treatment plan focused on pain, mobility, and getting back to daily life.",
  },
];

export function ICBCSection() {
  const reduced = useReducedMotionSafe();

  return (
    <Section tone="sage" id="icbc">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <SectionHeading
              eyebrow="ICBC & accident recovery"
              title="Injured in a car accident? We can help you start recovery."
            >
              If you have an active ICBC claim, you may be able to access up to 12 weeks
              of treatment (conditions and eligibility apply). Our team helps guide you
              through the process and match you with the right care for pain, stiffness,
              mobility, and recovery after an accident.
              {/* Owner confirmed: ICBC provides up to 12 weeks of treatment, conditions
                  apply. Wording kept accurate with the "conditions apply" caveat. */}
            </SectionHeading>

            <div className="mt-8 hidden h-24 w-24 items-center justify-center rounded-panel bg-mint/20 text-deep-teal lg:flex">
              <Car className="h-12 w-12" strokeWidth={1.5} aria-hidden="true" />
            </div>
          </div>

          <div className="relative">
            {/* connecting line */}
            <div
              className="absolute left-6 top-8 hidden h-[calc(100%-4rem)] w-0.5 bg-mint/30 sm:block"
              aria-hidden="true"
            >
              <motion.div
                className="w-full origin-top bg-deep-teal"
                initial={reduced ? { scaleY: 1 } : { scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={viewportOnce}
                transition={{ duration: 1, ease: easePremium }}
                style={{ height: "100%" }}
              />
            </div>

            <ol className="space-y-5">
              {steps.map((step, i) => (
                <motion.li
                  key={step.title}
                  className="glass relative flex gap-4 rounded-card p-5 shadow-card sm:pl-16"
                  initial={reduced ? { opacity: 1 } : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewportOnce}
                  transition={{ delay: i * 0.15, duration: 0.5, ease: easePremium }}
                >
                  <span className="absolute left-2 top-5 hidden h-9 w-9 items-center justify-center rounded-full bg-mint text-charcoal sm:flex">
                    <step.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="sm:hidden">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mint text-charcoal">
                      <step.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-charcoal">
                      <span className="mr-1.5 text-deep-teal">{i + 1}.</span>
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-charcoal/70">
                      {step.copy}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ol>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <BookButton label="Book ICBC Treatment" source="icbc_section" />
              <CallButton variant="secondary" source="icbc_section" />
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
