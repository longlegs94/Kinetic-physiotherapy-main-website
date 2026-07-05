import { Check } from "lucide-react";
import { clinic } from "@/lib/site-data";
import { cn } from "@/lib/utils";

/**
 * Trust badge row. Renders the verified/verifiable badges from content.
 * Owner should confirm each `needsVerification` badge before launch.
 */
export function TrustBadges({
  className,
  tone = "light",
  labels,
}: {
  className?: string;
  tone?: "light" | "dark";
  labels?: string[];
}) {
  const badges = labels ?? clinic.trustBadges.map((b) => b.label);

  return (
    <ul
      className={cn(
        "flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium",
        tone === "dark" ? "text-warm-white/80" : "text-charcoal/70",
        className
      )}
    >
      {badges.map((label) => (
        <li key={label} className="inline-flex items-center gap-1.5">
          <Check
            className={cn("h-4 w-4", tone === "dark" ? "text-mint" : "text-deep-teal")}
            aria-hidden="true"
          />
          {label}
        </li>
      ))}
    </ul>
  );
}
