"use client";

import Link from "next/link";
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
    <article className="group flex h-full flex-col items-center rounded-card glass p-6 text-center transition-all duration-200 ease-premium hover:-translate-y-1 hover:shadow-dark-glow">
      <div className="h-24 w-24 overflow-hidden rounded-full">
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.image}
            alt={`${p.name}, ${p.title} at Kinetic Therapy Clinic`}
            className="h-full w-full object-cover transition-transform duration-300 ease-premium group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sage to-mint/50">
            <span className="font-heading text-2xl font-bold text-charcoal/40">
              {initials(p.name)}
            </span>
          </div>
        )}
      </div>

      {p.icbcAccepted && (
        <span className="mt-3 inline-flex items-center gap-1 rounded-pill bg-sage/70 px-2.5 py-0.5 text-xs font-semibold text-deep-teal">
          <Check className="h-3.5 w-3.5" aria-hidden="true" /> ICBC
        </span>
      )}

      <h3 className="mt-4 text-lg font-bold text-charcoal">
        {p.name}
        <span
          className="mx-auto mt-1 block h-0.5 w-8 rounded-full bg-mint transition-all duration-200 ease-premium group-hover:w-14"
          aria-hidden="true"
        />
      </h3>
      <p className="mt-1 text-sm font-medium text-deep-teal">{p.title}</p>

      {p.bio && <p className="mt-3 text-sm leading-relaxed text-charcoal/70">{p.bio}</p>}

      {p.specialInterests && p.specialInterests.length > 0 && (
        <ul className="mt-3 flex flex-wrap justify-center gap-1.5">
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

      <div className={cn("mt-auto flex w-full gap-2 pt-5")}>
        <BookButton
          label="Book"
          variant="secondary"
          className="flex-1"
          source={`practitioner:${p.name}`}
        />
        <Link
          href="/team"
          className="flex-1 rounded-pill border border-charcoal/15 px-4 py-3 text-center text-[15px] font-semibold text-charcoal/70 transition-colors hover:border-deep-teal hover:text-charcoal"
        >
          View Bio
        </Link>
      </div>
    </article>
  );
}
