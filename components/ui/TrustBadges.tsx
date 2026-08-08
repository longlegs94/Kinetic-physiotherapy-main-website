import type { LucideIcon } from "lucide-react";
import { BadgeDollarSign, Car, Check, Clock, HeartHandshake, ShieldCheck } from "lucide-react";
import { clinic } from "@/lib/site-data";
import { cn } from "@/lib/utils";

/**
 * Trust badge row. Renders the verified/verifiable badges from content.
 * Owner should confirm each `needsVerification` badge before launch.
 *
 * Each badge pairs its label with a semantic icon rather than a repeated
 * checkmark, so "ICBC Accepted" and "Direct Billing" read as distinct claims
 * at a glance instead of four identical rows of text. Icons are matched by
 * exact label text; a label with no match falls back to a plain checkmark so
 * a new badge added to content/site-content.json never renders broken.
 */
const BADGE_ICONS: Record<string, LucideIcon> = {
  "ICBC Accepted": Car,
  "WSBC Support": ShieldCheck,
  "Direct Billing": BadgeDollarSign,
  "Multidisciplinary Care": HeartHandshake,
  "Open Evenings": Clock,
};

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
    <ul className={cn("flex flex-wrap items-center gap-2.5", className)}>
      {badges.map((label) => {
        const Icon = BADGE_ICONS[label] ?? Check;
        return (
          <li key={label}>
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-pill py-1.5 pl-1.5 pr-4 text-[13px] font-semibold shadow-card",
                tone === "dark"
                  ? "bg-soft-black text-warm-white/90"
                  : "bg-warm-white text-charcoal"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  tone === "dark" ? "bg-mint/20 text-mint" : "bg-sage text-deep-teal"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" strokeWidth={2.25} />
              </span>
              {label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
