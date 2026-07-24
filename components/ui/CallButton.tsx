"use client";

import { Phone } from "lucide-react";
import { clinic, phoneHref } from "@/lib/site-data";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type CallButtonProps = {
  variant?: "primary" | "secondary" | "secondary-dark";
  size?: "md" | "lg";
  className?: string;
  showNumber?: boolean;
  label?: string;
};

const base =
  "group inline-flex items-center justify-center gap-2 rounded-pill font-semibold transition-all duration-200 ease-premium";

const variants = {
  primary: "bg-mint text-charcoal hover:shadow-button-hover hover:-translate-y-0.5",
  secondary:
    "border border-charcoal/25 bg-transparent text-charcoal hover:border-deep-teal hover:bg-sage/50",
  "secondary-dark":
    "border border-white/40 bg-transparent text-warm-white hover:border-mint hover:bg-white/10",
} as const;

const sizes = {
  md: "px-6 py-3 text-[16px]",
  lg: "px-7 py-4 text-[17px]",
} as const;

/** Click-to-call button. Shows the number by default for trust. */
export function CallButton({
  variant = "secondary",
  size = "md",
  className,
  showNumber = true,
  label = "Call the Clinic",
}: CallButtonProps) {
  return (
    <a
      href={phoneHref}
      className={cn(base, variants[variant], sizes[size], className)}
      onClick={() => trackEvent("phone_click")}
      aria-label={`Call the clinic at ${clinic.phone}`}
    >
      <Phone className="h-[18px] w-[18px]" aria-hidden="true" />
      {showNumber ? clinic.phone : label}
    </a>
  );
}
