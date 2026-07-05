"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Signature mint "kinetic" line — an SVG path that draws itself when
 * scrolled into view (stroke-dashoffset animation via CSS class).
 * Reduced motion shows the full line immediately (handled in globals.css).
 */
export function KineticMotionLine({
  className,
  variant = "wave",
}: {
  className?: string;
  variant?: "wave" | "flat";
}) {
  const ref = useRef<SVGPathElement>(null);
  const [drawn, setDrawn] = useState(false);

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

  const d =
    variant === "wave"
      ? "M0,60 C160,10 320,110 480,60 C640,10 800,110 960,60 C1120,10 1280,110 1440,60"
      : "M0,60 L1440,60";

  return (
    <svg
      className={cn("pointer-events-none w-full", className)}
      viewBox="0 0 1440 120"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        ref={ref}
        d={d}
        stroke="url(#kt-mint-gradient)"
        strokeWidth={3}
        strokeLinecap="round"
        className={cn("kinetic-path", drawn && "is-drawn")}
      />
      <defs>
        <linearGradient id="kt-mint-gradient" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#72E0C0" stopOpacity="0.2" />
          <stop offset="0.5" stopColor="#72E0C0" />
          <stop offset="1" stopColor="#0F8F7A" stopOpacity="0.3" />
        </linearGradient>
      </defs>
    </svg>
  );
}
