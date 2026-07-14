"use client";

import { Phone, CalendarClock } from "lucide-react";
import { phoneHref, clinic } from "@/lib/site-data";
import { trackEvent } from "@/lib/analytics";

/**
 * Mobile-only sticky CTA bar scoped to the /icbc-claims paid-traffic page.
 * Deliberately a local component (not an edit to the shared
 * components/layout/StickyMobileBookingBar.tsx) so it can lead with
 * click-to-call + "Request a callback" instead of generic booking, which
 * converts better for accident victims on mobile. It shares the same fixed
 * bottom-of-screen slot as the global booking bar but sits above it
 * (higher z-index, opaque background, always visible rather than
 * scroll-triggered) so this page shows one consistent phone-first CTA
 * instead of two stacked bars.
 */
export function IcbcStickyBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] md:hidden" aria-hidden="false">
      <div className="mx-3 mb-3 flex gap-2 rounded-pill border border-charcoal/10 bg-warm-white p-2 shadow-card">
        <a
          href={phoneHref}
          onClick={() => trackEvent("icbc_cta_click", { cta: "sticky_call", source: "icbc_ads" })}
          aria-label={`Call the clinic at ${clinic.phone}`}
          className="flex flex-1 items-center justify-center gap-2 rounded-pill bg-mint py-3 text-[15px] font-semibold text-charcoal"
        >
          <Phone className="h-[18px] w-[18px]" aria-hidden="true" />
          Call Now
        </a>
        <a
          href="#callback-form"
          onClick={() =>
            trackEvent("icbc_cta_click", { cta: "sticky_callback", source: "icbc_ads" })
          }
          className="flex items-center justify-center gap-2 rounded-pill border border-charcoal/20 px-4 py-3 text-[15px] font-semibold text-charcoal"
        >
          <CalendarClock className="h-[18px] w-[18px]" aria-hidden="true" />
          Callback
        </a>
      </div>
    </div>
  );
}
