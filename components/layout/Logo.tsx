import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Kinetic Therapy brand mark — the "Kinetic Motion K" from the brand board:
 * a charcoal stem with a mint→teal motion ribbon flowing through it.
 * The ribbon animates in once on load (CSS .kt-swoosh; disabled for
 * reduced motion) per the board's "animated logo concept".
 */
export function KineticMark({
  className,
  stem = "currentColor",
}: {
  className?: string;
  /** Stem color; defaults to currentColor so text color controls it. */
  stem?: string;
}) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className={className}>
      <defs>
        <linearGradient
          id="kt-k-flow"
          x1="54"
          y1="6"
          x2="6"
          y2="50"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#0F8F7A" />
          <stop offset="0.45" stopColor="#2CC9A6" />
          <stop offset="1" stopColor="#72E0C0" />
        </linearGradient>
        <linearGradient
          id="kt-k-leg"
          x1="22"
          y1="34"
          x2="56"
          y2="62"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#2CC9A6" />
          <stop offset="1" stopColor="#0F8F7A" />
        </linearGradient>
      </defs>

      {/* stem */}
      <rect x="12" y="4" width="9" height="56" rx="4.5" fill={stem} />

      {/* motion ribbon: flows from top-right through the stem, tailing out lower-left */}
      <path
        className="kt-swoosh"
        d="M54 6 C40 13 29 25 21.5 34.5 C15.5 42 9.5 46.5 4.5 48.5"
        stroke="url(#kt-k-flow)"
        strokeWidth="8.5"
        strokeLinecap="round"
      />
      {/* lower leg, sweeping to bottom-right */}
      <path
        className="kt-swoosh"
        d="M23 35 C32 39.5 43 49 53.5 59"
        stroke="url(#kt-k-leg)"
        strokeWidth="8.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  tone = "dark",
  className,
}: {
  tone?: "dark" | "light";
  className?: string;
}) {
  const textColor = tone === "light" ? "text-warm-white" : "text-charcoal";

  return (
    <Link
      href="/"
      aria-label="Kinetic Therapy Clinic — home"
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <KineticMark
        className={cn("h-10 w-10 shrink-0", textColor)}
        stem="currentColor"
      />
      <span className="flex flex-col leading-none">
        <span className={cn("font-heading text-lg font-bold tracking-tight", textColor)}>
          KINETIC
        </span>
        <span
          className={cn(
            "text-[13px] font-medium tracking-[0.02em]",
            tone === "light" ? "text-mint" : "text-deep-teal"
          )}
        >
          Therapy
        </span>
      </span>
    </Link>
  );
}
