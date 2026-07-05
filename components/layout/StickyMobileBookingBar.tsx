"use client";

import { useEffect, useState } from "react";
import { Calendar, Phone } from "lucide-react";
import { janeBookingUrl, phoneHref, clinic } from "@/lib/site-data";
import { trackEvent } from "@/lib/analytics";

/**
 * Mobile-only sticky booking bar. Appears after the user scrolls ~20% down
 * the page so booking is always one tap away.
 */
export function StickyMobileBookingBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY;
      const threshold = window.innerHeight * 0.6;
      setVisible(scrolled > threshold);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={[
        "fixed inset-x-0 bottom-0 z-[55] md:hidden",
        "transition-transform duration-300 ease-premium",
        visible ? "translate-y-0" : "translate-y-full",
      ].join(" ")}
      aria-hidden={!visible}
    >
      <div className="mx-3 mb-3 flex gap-2 rounded-pill border border-silver/60 bg-warm-white/95 p-2 shadow-card backdrop-blur">
        <a
          href={janeBookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("sticky_bar_click", { action: "book" })}
          className="flex flex-1 items-center justify-center gap-2 rounded-pill bg-mint py-3 text-[15px] font-semibold text-charcoal"
          tabIndex={visible ? 0 : -1}
        >
          <Calendar className="h-[18px] w-[18px]" aria-hidden="true" />
          Book Now
        </a>
        <a
          href={phoneHref}
          onClick={() => trackEvent("sticky_bar_click", { action: "call" })}
          aria-label={`Call the clinic at ${clinic.phone}`}
          className="flex items-center justify-center gap-2 rounded-pill border border-charcoal/20 px-5 py-3 text-[15px] font-semibold text-charcoal"
          tabIndex={visible ? 0 : -1}
        >
          <Phone className="h-[18px] w-[18px]" aria-hidden="true" />
          Call
        </a>
      </div>
    </div>
  );
}
