"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Phone } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { janeBookingUrl, clinic, phoneHref } from "@/lib/site-data";

type ServiceLink = { name: string; slug: string };

type Result =
  | {
      reply: string;
      services: ServiceLink[];
      showBooking: boolean;
      showContact: boolean;
    }
  | { offline: true };

const MAX_INPUT_LENGTH = 300;

/**
 * One-shot free-text symptom router. Reuses the existing /api/concierge
 * backend to suggest the right service(s) without opening the full chat
 * widget. Never throws — falls back to a graceful offline message.
 */
export function SymptomRouter() {
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  function reset() {
    setResult(null);
    setInput("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || pending) return;

    trackEvent("symptom_router_submit");
    setPending(true);

    try {
      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: trimmed }] }),
      });

      if (res.status === 503) {
        setResult({ offline: true });
        return;
      }

      if (!res.ok) {
        setResult({ offline: true });
        return;
      }

      const data: {
        reply: string;
        services: ServiceLink[];
        show_booking: boolean;
        show_contact: boolean;
      } = await res.json();

      setResult({
        reply: data.reply,
        services: data.services,
        showBooking: data.show_booking,
        showContact: data.show_contact,
      });
    } catch {
      setResult({ offline: true });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="glass mx-auto max-w-2xl rounded-panel p-6 sm:p-8">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-deep-teal" aria-hidden="true" />
        <h3 className="font-heading text-lg font-bold text-charcoal">
          Describe it in your own words
        </h3>
      </div>
      <p className="mt-1 text-sm text-charcoal/60">
        Tell us what&apos;s going on and we&apos;ll point you to the right care — guidance
        only, not medical advice.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="symptom-input" className="sr-only">
          Describe what&apos;s going on
        </label>
        <input
          id="symptom-input"
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value.slice(0, MAX_INPUT_LENGTH))}
          maxLength={MAX_INPUT_LENGTH}
          placeholder="e.g. My shoulder hurts when I reach overhead…"
          className="flex-1 rounded-pill border border-silver bg-white px-5 py-3 text-charcoal placeholder:text-charcoal/40 outline-none focus:border-deep-teal"
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-pill bg-mint px-5 py-3 font-semibold text-charcoal transition-opacity disabled:opacity-40"
        >
          {pending ? "Thinking…" : "Find my care"}
          {!pending && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        </button>
      </form>

      <div aria-live="polite">
        {result && "offline" in result && (
          <div className="mt-5 block rounded-card border border-mint/40 bg-white/80 p-5">
            <p className="text-[15px] leading-relaxed text-charcoal/85">
              Our assistant is offline right now — browse the options below, or call{" "}
              {clinic.phone} and our team will guide you.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={phoneHref}
                className="inline-flex items-center gap-1 rounded-pill border border-silver/60 bg-white/80 px-3 py-1.5 text-xs font-semibold text-charcoal"
              >
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                {clinic.phone}
              </a>
              <Link
                href="/contact"
                className="rounded-pill border border-deep-teal/30 bg-sage/40 px-3 py-1.5 text-xs font-semibold text-deep-teal"
              >
                Contact Us
              </Link>
            </div>
          </div>
        )}

        {result && !("offline" in result) && (
          <div className="mt-5 block rounded-card border border-mint/40 bg-white/80 p-5">
            <p className="text-[15px] leading-relaxed text-charcoal/85">{result.reply}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {result.services.map((service) => (
                <Link
                  key={service.slug}
                  href={`/${service.slug}`}
                  onClick={() =>
                    trackEvent("concierge_service_click", { service: service.slug })
                  }
                  className="rounded-pill bg-sage/70 px-3 py-1.5 text-xs font-semibold text-deep-teal transition-colors hover:bg-sage"
                >
                  {service.name}
                </Link>
              ))}
              {result.showBooking && (
                <a
                  href={janeBookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent("concierge_book_click")}
                  className="rounded-pill bg-mint px-4 py-2 text-sm font-semibold text-charcoal"
                >
                  Book Now
                </a>
              )}
              {result.showContact && (
                <Link
                  href="/contact"
                  className="rounded-pill border border-deep-teal/30 bg-sage/40 px-3 py-1.5 text-xs font-semibold text-deep-teal"
                >
                  Contact Us
                </Link>
              )}
              <button
                type="button"
                onClick={reset}
                className="rounded-pill px-3 py-1.5 text-xs font-semibold text-charcoal/50 transition-colors hover:text-charcoal"
              >
                Ask again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
