"use client";

/**
 * Lightweight analytics event dispatch. Sends to GA4 (gtag) when
 * NEXT_PUBLIC_GA_ID is set, and always dispatches a "kt:conversion"
 * CustomEvent on window for any other listener (e.g. local debugging).
 * There is no Vercel Analytics (or other provider) wired in today — this
 * repo has no @vercel/analytics dependency. Safe to call anywhere — it
 * no-ops when GA4 isn't configured and nothing else is listening.
 */
export type ConversionEvent =
  | "book_now_click"
  | "jane_outbound_click"
  | "phone_click"
  | "contact_submit"
  | "intake_submit"
  | "service_card_click"
  | "pain_point_click"
  | "icbc_cta_click"
  | "icbc_callback_submit"
  // Not currently fired anywhere — BookButton unifies all book clicks
  // (including practitioner cards) into book_now_click/jane_outbound_click
  // with a `source` param instead. Kept in case a distinct practitioner
  // funnel stage is wanted later. See docs/ANALYTICS.md "Dead union entries".
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
