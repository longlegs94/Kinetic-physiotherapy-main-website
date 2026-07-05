"use client";

import { Check } from "lucide-react";
import type { Practitioner } from "@/lib/site-data";
import { BookButton } from "@/components/ui/BookButton";
import { cn } from "@/lib/utils";

/** Get initials for the avatar placeholder. */
function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Practitioner card. Uses a photo when available, otherwise a tasteful
 * initials avatar. Bio/specialties render only when present in content.
 * TODO(assets): add practitioner photos to /public/images/team.
 */
export function PractitionerCard({ practitioner }: { practitioner: Practitioner }) {
  const p = practitioner;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-card border border-silver/60 bg-white shadow-card transition-all duration-200 ease-premium hover:-translate-y-1 hover:shadow-dark-glow">
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-sage to-mint/40">
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.image}
            alt={`${p.name}, ${p.title} at Kinetic Therapy Clinic`}
            className="h-full w-full object-cover transition-transform duration-300 ease-premium group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-heading text-5xl font-bold text-charcoal/25">
              {initials(p.name)}
            </span>
          </div>
        )}
        {p.icbcAccepted && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-pill bg-warm-white/90 px-3 py-1 text-xs font-semibold text-deep-teal backdrop-blur">
            <Check className="h-3.5 w-3.5" aria-hidden="true" /> ICBC
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold text-charcoal">{p.name}</h3>
        <p className="text-sm font-medium text-deep-teal">{p.title}</p>

        {p.bio && <p className="mt-3 text-sm leading-relaxed text-charcoal/70">{p.bio}</p>}

        {p.specialInterests && p.specialInterests.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {p.specialInterests.map((tag) => (
              <li
                key={tag}
                className="rounded-pill bg-sage/70 px-2.5 py-1 text-xs font-medium text-charcoal/70"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}

        {p.schedule && (
          <p className="mt-3 text-xs font-medium text-charcoal/55">{p.schedule}</p>
        )}

        <div className={cn("mt-auto pt-5")}>
          <BookButton
            label="Book"
            variant="secondary"
            size="md"
            className="w-full"
            source={`practitioner:${p.name}`}
          />
        </div>
      </div>
    </article>
  );
}
