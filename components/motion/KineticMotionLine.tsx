"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

/**
 * Signature "motion line system" from the brand board: a soft, silk-like
 * ribbon (blurred glow body + mid sheen + crisp line) that
 * 1. draws in when scrolled into view, then
 * 2. undulates in a slow continuous wave (path `d` morph).
 * Reduced motion: static full ribbon, no draw, no wave.
 */

/** Wave phases — identical command structure so the paths can interpolate. */
const WAVE_UP =
  "M0,60 C160,10 320,110 480,60 C640,10 800,110 960,60 C1120,10 1280,110 1440,60";
const WAVE_DOWN =
  "M0,60 C160,110 320,10 480,60 C640,110 800,10 960,60 C1120,110 1280,10 1440,60";
const FLAT = "M0,60 C160,60 320,60 480,60 C640,60 800,60 960,60 C1120,60 1280,60 1440,60";

const WAVE_ANIM = { d: [WAVE_UP, WAVE_DOWN, WAVE_UP] };
const WAVE_TRANSITION = { duration: 11, repeat: Infinity, ease: "easeInOut" as const };

export function KineticMotionLine({
  className,
  variant = "wave",
}: {
  className?: string;
  variant?: "wave" | "flat";
}) {
  const ref = useRef<SVGPathElement>(null);
  const [drawn, setDrawn] = useState(false);
  const [waving, setWaving] = useState(false);
  const reduced = useReducedMotionSafe();

  // Draw-in on first viewport entry.
  useEffect(() => {
    const path = ref.current;
    if (!path) return;

    const length = path.getTotalLength();
    path.style.setProperty("--path-length", `${length}`);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setDrawn(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(path);
    return () => observer.disconnect();
  }, []);

  // Once the draw-in transition (1.6s) finishes, hand over to the wave loop.
  useEffect(() => {
    if (!drawn || reduced || variant !== "wave") return;
    const t = setTimeout(() => setWaving(true), 1700);
    return () => clearTimeout(t);
  }, [drawn, reduced, variant]);

  const d = variant === "wave" ? WAVE_UP : FLAT;
  const softVisible = reduced || drawn;
  const animateD = waving ? WAVE_ANIM : undefined;

  return (
    <svg
      className={cn("pointer-events-none w-full", className)}
      viewBox="0 0 1440 120"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="kt-mint-gradient" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#72E0C0" stopOpacity="0.2" />
          <stop offset="0.5" stopColor="#72E0C0" />
          <stop offset="1" stopColor="#0F8F7A" stopOpacity="0.3" />
        </linearGradient>
        <filter id="kt-ribbon-blur" x="-20%" y="-150%" width="140%" height="400%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id="kt-ribbon-blur-sm" x="-20%" y="-150%" width="140%" height="400%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>

      {/* soft glow body */}
      <motion.path
        d={d}
        stroke="url(#kt-mint-gradient)"
        strokeWidth={30}
        strokeLinecap="round"
        filter="url(#kt-ribbon-blur)"
        className="transition-opacity duration-1000"
        style={{ opacity: softVisible ? 0.22 : 0 }}
        animate={animateD}
        transition={waving ? WAVE_TRANSITION : undefined}
      />
      {/* mid sheen */}
      <motion.path
        d={d}
        stroke="url(#kt-mint-gradient)"
        strokeWidth={12}
        strokeLinecap="round"
        filter="url(#kt-ribbon-blur-sm)"
        className="transition-opacity duration-1000"
        style={{ opacity: softVisible ? 0.35 : 0 }}
        animate={animateD}
        transition={waving ? WAVE_TRANSITION : undefined}
      />
      {/* crisp line (draw-in, then wave) */}
      <motion.path
        ref={ref}
        d={d}
        stroke="url(#kt-mint-gradient)"
        strokeWidth={3}
        strokeLinecap="round"
        className={cn(!waving && "kinetic-path", drawn && !waving && "is-drawn")}
        style={waving ? { strokeDasharray: "none" } : undefined}
        animate={animateD}
        transition={waving ? WAVE_TRANSITION : undefined}
      />
    </svg>
  );
}
