import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "warm" | "white" | "sage" | "charcoal";

const tones: Record<Tone, string> = {
  // "warm" is transparent so the site-wide foggy gradient shows through.
  warm: "bg-transparent text-charcoal",
  white: "bg-white/70 text-charcoal backdrop-blur-[2px]",
  sage: "bg-sage/40 text-charcoal",
  charcoal: "bg-charcoal text-warm-white",
};

/** Full-width section with vertical rhythm from design tokens. */
export function Section({
  children,
  tone = "warm",
  className,
  id,
  ariaLabel,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  id?: string;
  ariaLabel?: string;
}) {
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={cn("py-[72px] md:py-[112px]", tones[tone], className)}
    >
      {children}
    </section>
  );
}

/** Max-width content container. */
export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("container-kt", className)}>{children}</div>;
}
