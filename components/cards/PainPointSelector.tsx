"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Baby,
  Car,
  Footprints,
  HandHelping,
  HardHat,
  HeartPulse,
  HelpCircle,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { staggerParent, staggerChild, viewportOnce } from "@/lib/motion";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { homepage } from "@/lib/site-data";

const ICON_BY_LABEL: Record<string, LucideIcon> = {
  "Back or neck pain": Activity,
  "Car accident injury": Car,
  "Sports injury": Trophy,
  "Massage therapy": HandHelping,
  "Pregnancy-related pain": Baby,
  "Work injury": HardHat,
  "Chronic pain": HeartPulse,
  "Foot pain / orthotics": Footprints,
  "Not sure what I need": HelpCircle,
};

/** Small mint icon per pain point, keyed by label. Falls back to HeartPulse. */
function iconFor(label: string): LucideIcon {
  return ICON_BY_LABEL[label] ?? HeartPulse;
}

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
      {homepage.painPoints.map((point) => {
        const Icon = iconFor(point.label);
        return (
          <Child
            key={point.label}
            variants={reduced ? undefined : staggerChild}
            className="group rounded-card glass p-5 transition-all duration-200 ease-premium hover:-translate-y-1 hover:border-mint hover:shadow-button-hover"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-mint/20 text-deep-teal">
              <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-charcoal">{point.label}</h3>
            <p className="mt-2 text-sm text-charcoal/60">
              <span className="font-semibold text-deep-teal">Recommended: </span>
              {point.recommended.join(", ")}
            </p>
          </Child>
        );
      })}
    </Parent>
  );
}
