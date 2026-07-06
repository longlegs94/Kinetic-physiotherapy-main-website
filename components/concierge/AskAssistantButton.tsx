"use client";

import { MessageCircle } from "lucide-react";

/**
 * Opens the site-wide concierge widget from anywhere (e.g. under the FAQ).
 * Dispatches the global event the ConciergeWidget listens for.
 */
export function AskAssistantButton({ label = "Ask our assistant" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("kt:concierge:open"))}
      className="inline-flex items-center gap-2 rounded-pill border border-deep-teal/30 bg-sage/40 px-5 py-3 text-[15px] font-semibold text-deep-teal transition-colors duration-200 ease-premium hover:border-deep-teal hover:bg-sage/70"
    >
      <MessageCircle className="h-[18px] w-[18px]" aria-hidden="true" />
      {label}
    </button>
  );
}
