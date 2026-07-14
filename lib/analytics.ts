"use client";

/**
 * Lightweight analytics event dispatch. Sends to GA4 (gtag) when
 * NEXT_PUBLIC_GA_ID is set, and always to Vercel Analytics if present.
 * Safe to call anywhere — no-ops when no provider is configured.
 */
export type ConversionEvent =
  | "book_now_click"
  | "jane_outbound_click"
  | "phone_click"
  | "contact_submit"
  | "service_card_click"
  | "pain_point_click"
  | "icbc_cta_click"
  | "icbc_callback_submit"
  | "practitioner_book_click"
  | "sticky_bar_click"
  | "concierge_open"
  | "concierge_book_click"
  | "concierge_service_click"
  | "symptom_router_submit"
  | "review_google_click"
  | "review_feedback_submit"
  | "review_cta_click";

type EventParams = Record<string, string | number | boolean | undefined>;

export function trackEvent(event: ConversionEvent, params: EventParams = {}) {
  if (typeof window === "undefined") return;

  // GA4
  const w = window as unknown as {
    gtag?: (command: string, event: string, params?: EventParams) => void;
  };
  if (typeof w.gtag === "function") {
    w.gtag("event", event, params);
  }

  // Custom event for any other listener / debugging
  window.dispatchEvent(new CustomEvent("kt:conversion", { detail: { event, params } }));
}
