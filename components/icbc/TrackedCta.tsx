"use client";

import type { ReactNode } from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * Wraps a call-to-action (CallButton, BookButton, anchor link, etc.) so it
 * also fires a distinct "icbc_cta_click" GA4 event tagged with which CTA it
 * was, on top of whatever event the inner component already fires. Uses
 * `display: contents` so the wrapper never affects flex/grid layout of the
 * button it wraps.
 */
export function TrackedCta({
  cta,
  source = "icbc_ads",
  children,
}: {
  cta: string;
  source?: string;
  children: ReactNode;
}) {
  return (
    <div className="contents" onClick={() => trackEvent("icbc_cta_click", { cta, source })}>
      {children}
    </div>
  );
}
