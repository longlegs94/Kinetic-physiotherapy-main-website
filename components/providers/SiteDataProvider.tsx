"use client";

import { createContext, useContext, useMemo } from "react";

import type { Clinic } from "@/lib/site-data";
import {
  clinic as bundledClinic,
  janeBookingUrl as bundledBookingUrl,
  phoneHref as bundledPhoneHref,
  emailHref as bundledEmailHref,
} from "@/lib/site-data";

/**
 * Supplies live clinic details to client components.
 *
 * Client components cannot read the database: their JavaScript runs in the
 * browser, and anything they import is frozen into the bundle at build time.
 * Before this provider, every "Book Now" button and footer phone number was
 * exactly that — a build-time constant — so a phone number changed in the
 * portal would not appear until the next deploy, and server-rendering the new
 * value against a bundle holding the old one would break hydration.
 *
 * The site layout reads the database once per render and passes the result
 * down through here instead.
 *
 * **Falling back rather than throwing is deliberate.** A component rendered
 * outside the provider — the global 404, the error boundary — still gets the
 * content bundled at build time. Those are exactly the surfaces that must not
 * fail, and a slightly stale phone number on an error page is a far better
 * outcome than an error page that itself crashes.
 */

export type SiteData = {
  clinic: Clinic;
  /** Where every "Book Now" button points. */
  janeBookingUrl: string;
  phoneHref: string;
  emailHref: string;
};

const BUNDLED: SiteData = {
  clinic: bundledClinic,
  janeBookingUrl: bundledBookingUrl,
  phoneHref: bundledPhoneHref,
  emailHref: bundledEmailHref,
};

const SiteDataContext = createContext<SiteData | null>(null);

export function SiteDataProvider({
  clinic,
  janeBookingUrl,
  children,
}: {
  clinic: Clinic;
  janeBookingUrl: string;
  children: React.ReactNode;
}) {
  const value = useMemo<SiteData>(
    () => ({
      clinic,
      janeBookingUrl,
      phoneHref: `tel:${clinic.phone.replace(/[^\d+]/g, "")}`,
      emailHref: `mailto:${clinic.email}`,
    }),
    [clinic, janeBookingUrl]
  );

  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>;
}

/** Live clinic details, or the build-time copy when rendered outside the
 *  provider. Never throws — see the note above. */
export function useSiteData(): SiteData {
  return useContext(SiteDataContext) ?? BUNDLED;
}

/** Shorthand for the common case. */
export function useClinic(): Clinic {
  return useSiteData().clinic;
}
