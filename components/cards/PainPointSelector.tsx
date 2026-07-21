"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
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
import { trackEvent } from "@/lib/analytics";

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

/** Primary destination per pain point so every card is actionable. */
const HREF_BY_LABEL: Record<string, string> = {
  "Back or neck pain": "/physiotherapy-maple-ridge",
  "Car accident injury": "/icbc-physio-maple-ridge",
  "Sports injury": "/physiotherapy-maple-ridge",
  "Massage therapy": "/massage-therapy-maple-ridge",
  "Pregnancy-related pain": "/pregnancy-massage-maple-ridge",
  "Work injury": "/physiotherapy-maple-ridge",
  "Chronic pain": "/physiotherapy-maple-ridge",
  "Foot pain / orthotics": "/orthotics-bracing-maple-ridge",
  "Not sure what I need": "/contact",
};

/** Small mint icon per pain point, keyed by label. Falls back to HeartPulse. */
function iconFor(label: string): LucideIcon {
  return ICON_BY_LABEL[label] ?? HeartPulse;
}

/**
 * Intent-based entry point. Each card names a problem, shows the recommended
 * services, and links straight to the most relevant page so a person in pain
 * can self-route in one tap.
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
        const href = HREF_BY_LABEL[point.label] ?? "/services";
        return (
          <Child key={point.label} variants={reduced ? undefined : staggerChild}>
            <Link
              href={href}
              onClick={() => trackEvent("pain_point_click", { pain: point.label })}
              className="group block h-full rounded-card glass p-5 transition-all duration-200 ease-premium hover:-translate-y-1 hover:border-mint hover:shadow-button-hover"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-mint/20 text-deep-teal">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <ArrowRight
                  className="mt-2 h-4 w-4 text-deep-teal opacity-0 transition-all duration-200 ease-premium group-hover:translate-x-0.5 group-hover:opacity-100"
                  aria-hidden="true"
                />
              </div>
              <h3 className="mt-4 text-lg font-bold text-charcoal">{point.label}</h3>
              <p className="mt-2 text-sm text-charcoal/70">
                <span className="font-semibold text-deep-teal">Recommended: </span>
                {point.recommended.join(", ")}
              </p>
            </Link>
          </Child>
        );
      })}
    </Parent>
  );
}
