"use client";

import { motion } from "framer-motion";
import { staggerParent, staggerChild, viewportOnce } from "@/lib/motion";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { homepage } from "@/lib/site-data";

/**
 * Intent-based entry point. Each card names a problem and the recommended
 * services, so a person in pain can self-route quickly.
 */
export function PainPointSelector() {
  const reduced = useReducedMotionSafe();
  const Parent = reduced ? "div" : motion.div;
  const Child = reduced ? "div" : motion.div;

  const parentProps = reduced
    ? {}
    : {
        variants: staggerParent,
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: viewportOnce,
      };

  return (
    <Parent
      {...parentProps}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {homepage.painPoints.map((point) => (
        <Child
          key={point.label}
          variants={reduced ? undefined : staggerChild}
          className="group rounded-card border border-silver/60 bg-white p-5 shadow-card transition-all duration-200 ease-premium hover:-translate-y-1 hover:border-mint"
        >
          <h3 className="text-lg font-bold text-charcoal">{point.label}</h3>
          <p className="mt-2 text-sm text-charcoal/60">
            <span className="font-semibold text-deep-teal">Recommended: </span>
            {point.recommended.join(", ")}
          </p>
        </Child>
      ))}
    </Parent>
  );
}
