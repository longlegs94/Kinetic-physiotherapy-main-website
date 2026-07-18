"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, CalendarClock, Stethoscope } from "lucide-react";
import type { Practitioner } from "@/lib/site-data";
import { BookButton } from "@/components/ui/BookButton";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { easePremium } from "@/lib/motion";
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

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/**
 * Practitioner card with an inline, expand-in-place bio. Clicking the card
 * header (or the "View Bio" toggle) reveals a details panel that animates
 * open beneath the card, pushing the rest of the content down. Uses a photo
 * when available, otherwise a tasteful initials avatar.
 * TODO(assets): add practitioner photos to /public/images/team.
 */
export function PractitionerCard({ practitioner }: { practitioner: Practitioner }) {
  const p = practitioner;
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotionSafe();
  const panelId = `bio-${slugify(p.name)}`;

  const hasDetails =
    Boolean(p.bio) ||
    Boolean(p.schedule) ||
    Boolean(p.icbcAccepted) ||
    (p.specialInterests?.length ?? 0) > 0 ||
    (p.languages?.length ?? 0) > 0;

  const toggle = () => setOpen((v) => !v);

  return (
    <article className="group flex flex-col rounded-card glass p-6 text-center transition-all duration-200 ease-premium hover:-translate-y-1 hover:shadow-dark-glow">
      {/* Clickable header — toggles the bio panel */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex flex-col items-center rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-deep-teal"
      >
        <span className="h-24 w-24 overflow-hidden rounded-full">
          {p.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.image}
              alt={`${p.name}, ${p.title} at Kinetic Therapy Clinic`}
              className="h-full w-full object-cover transition-transform duration-300 ease-premium group-hover:scale-[1.05]"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sage to-mint/50">
              <span className="font-heading text-2xl font-bold text-charcoal/60">
                {initials(p.name)}
              </span>
            </span>
          )}
        </span>

        {p.icbcAccepted && (
          <span className="mt-3 inline-flex items-center gap-1 rounded-pill bg-sage/70 px-2.5 py-0.5 text-xs font-semibold text-deep-teal">
            <Check className="h-3.5 w-3.5" aria-hidden="true" /> ICBC
          </span>
        )}

        <span className="mt-4 block text-lg font-bold text-charcoal">{p.name}</span>
        <span
          className={cn(
            "mx-auto mt-1 block h-0.5 rounded-full bg-mint transition-all duration-200 ease-premium",
            open ? "w-14" : "w-8 group-hover:w-14"
          )}
          aria-hidden="true"
        />
        <span className="mt-1 block text-sm font-medium text-deep-teal">{p.title}</span>
      </button>

      {/* Expandable details panel */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-label={`About ${p.name}`}
            initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduced ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: easePremium }}
            className="overflow-hidden"
          >
            <div className="mt-4 border-t border-silver/60 pt-4 text-left">
              {p.bio && (
                <p className="text-sm leading-relaxed text-charcoal/75">{p.bio}</p>
              )}

              <dl className="mt-3 space-y-2 text-sm text-charcoal/70">
                <div className="flex items-start gap-2">
                  <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-deep-teal" aria-hidden="true" />
                  <span>
                    <span className="font-semibold text-charcoal">Discipline: </span>
                    {p.category}
                  </span>
                </div>
                {p.schedule && (
                  <div className="flex items-start gap-2">
                    <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-deep-teal" aria-hidden="true" />
                    <span>
                      <span className="font-semibold text-charcoal">Availability: </span>
                      {p.schedule}
                    </span>
                  </div>
                )}
                {p.icbcAccepted && (
                  <div className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-deep-teal" aria-hidden="true" />
                    <span>Accepts ICBC patients (conditions and eligibility apply).</span>
                  </div>
                )}
              </dl>

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

              {p.languages && p.languages.length > 0 && (
                <p className="mt-3 text-xs text-charcoal/60">
                  <span className="font-semibold text-charcoal">Languages: </span>
                  {p.languages.join(", ")}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-auto flex w-full gap-2 pt-5">
        <BookButton
          label="Book"
          variant="secondary"
          className="flex-1"
          source={`practitioner:${p.name}`}
        />
        {hasDetails && (
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-controls={panelId}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-pill border border-charcoal/15 px-4 py-3 text-[15px] font-semibold text-charcoal/70 transition-colors hover:border-deep-teal hover:text-charcoal"
          >
            {open ? "Hide" : "View Bio"}
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200 ease-premium",
                open && "rotate-180"
              )}
              aria-hidden="true"
            />
          </button>
        )}
      </div>
    </article>
  );
}
