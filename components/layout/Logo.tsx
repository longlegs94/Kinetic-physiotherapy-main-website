import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Kinetic Therapy wordmark. The "K" mark is drawn as an SVG so it stays
 * crisp and themeable. Swap for the official logo asset when available.
 * TODO(assets): replace mark with clinic's official logo SVG if provided.
 */
export function Logo({
  tone = "dark",
  className,
}: {
  tone?: "dark" | "light";
  className?: string;
}) {
  const textColor = tone === "light" ? "text-warm-white" : "text-charcoal";
  const subColor = tone === "light" ? "text-warm-white/60" : "text-charcoal/55";

  return (
    <Link
      href="/"
      aria-label="Kinetic Therapy Clinic — home"
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <svg
        width="34"
        height="34"
        viewBox="0 0 34 34"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="34" height="34" rx="9" fill="#72E0C0" />
        <path
          d="M12 8v18M12 17l8-9M12 17l8 9"
          stroke="#111416"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="flex flex-col leading-none">
        <span className={cn("font-heading text-lg font-bold tracking-tight", textColor)}>
          KINETIC
        </span>
        <span
          className={cn(
            "text-[10px] font-semibold uppercase tracking-[0.28em]",
            subColor
          )}
        >
          Therapy
        </span>
      </span>
    </Link>
  );
}
