import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "secondary-dark" | "ghost";
type Size = "md" | "lg";

const base =
  "group inline-flex items-center justify-center gap-2 rounded-pill font-semibold transition-all duration-200 ease-premium focus-visible:outline-none disabled:opacity-60";

const sizes: Record<Size, string> = {
  md: "px-6 py-3 text-[16px]",
  lg: "px-7 py-4 text-[17px]",
};

const variants: Record<Variant, string> = {
  primary:
    "bg-mint text-charcoal hover:bg-mint hover:shadow-button-hover hover:-translate-y-0.5",
  secondary:
    "border border-charcoal/25 bg-transparent text-charcoal hover:border-deep-teal hover:bg-sage/50",
  "secondary-dark":
    "border border-white/40 bg-transparent text-warm-white hover:border-mint hover:bg-white/10",
  ghost: "bg-transparent text-deep-teal hover:text-charcoal underline-offset-4 hover:underline",
};

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  withArrow?: boolean;
};

type LinkButtonProps = CommonProps & {
  href: string;
  external?: boolean;
  onClick?: () => void;
  "aria-label"?: string;
};

/** Link-style button (used for CTAs and navigation actions). */
export function LinkButton({
  children,
  href,
  variant = "primary",
  size = "md",
  className,
  withArrow = true,
  external = false,
  onClick,
  ...rest
}: LinkButtonProps) {
  const classes = cn(base, sizes[size], variants[variant], className);
  const arrow = withArrow ? (
    <ArrowRight
      className="h-[18px] w-[18px] transition-transform duration-200 ease-premium group-hover:translate-x-1"
      aria-hidden="true"
    />
  ) : null;

  if (external) {
    const suppliedLabel = rest["aria-label"];
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        onClick={onClick}
        {...rest}
        aria-label={suppliedLabel ? `${suppliedLabel} (opens in a new tab)` : undefined}
      >
        {children}
        {arrow}
        {!suppliedLabel && <span className="sr-only"> (opens in a new tab)</span>}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} onClick={onClick} {...rest}>
      {children}
      {arrow}
    </Link>
  );
}
