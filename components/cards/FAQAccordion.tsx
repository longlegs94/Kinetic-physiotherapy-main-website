"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import type { Faq } from "@/lib/site-data";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { easePremium } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Accessible FAQ accordion with plus/minus rotation and smooth height. */
export function FAQAccordion({ faqs }: { faqs: Faq[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const reduced = useReducedMotionSafe();
  const baseId = useId();

  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => {
        const isOpen = open === i;
        const panelId = `${baseId}-panel-${i}`;
        const buttonId = `${baseId}-button-${i}`;
        return (
          <div key={faq.question} className="glass overflow-hidden rounded-card transition-colors hover:border-mint/60">
            <h3>
              <button
                type="button"
                id={buttonId}
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-7"
              >
                <span className="text-base font-semibold text-charcoal sm:text-lg">
                  {faq.question}
                </span>
                <Plus
                  className={cn(
                    "h-5 w-5 shrink-0 text-deep-teal transition-transform duration-200 ease-premium",
                    isOpen && "rotate-45"
                  )}
                  aria-hidden="true"
                />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  animate={reduced ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                  exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: easePremium }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-6 text-[15px] leading-relaxed text-charcoal/70 sm:px-7">
                    {faq.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
