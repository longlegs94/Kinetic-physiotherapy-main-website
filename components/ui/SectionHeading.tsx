import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Consistent eyebrow + H2 + supporting paragraph block for sections. */
export function SectionHeading({
  eyebrow,
  title,
  children,
  align = "left",
  tone = "light",
  className,
  as = "h2",
}: {
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
  as?: "h1" | "h2";
}) {
  const Title = as;
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && (
        <span
          className={cn(
            "inline-block text-sm font-semibold uppercase tracking-[0.14em]",
            tone === "dark" ? "text-mint" : "text-deep-teal"
          )}
        >
          {eyebrow}
        </span>
      )}
      <Title
        className={cn(
          "mt-3 text-section-h2 font-bold",
          as === "h1" && "text-page-h1",
          tone === "dark" ? "text-warm-white" : "text-charcoal"
        )}
      >
        {title}
      </Title>
      {children && (
        <p
          className={cn(
            "mt-4 text-lg leading-relaxed",
            tone === "dark" ? "text-warm-white/75" : "text-charcoal/70"
          )}
        >
          {children}
        </p>
      )}
    </div>
  );
}
