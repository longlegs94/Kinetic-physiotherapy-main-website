"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Send, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { clinic } from "@/lib/site-data";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { CONTACT_CATEGORIES, CALLBACK_TIMES } from "@/lib/contact";

function trackReviewCtaClick(source: string) {
  trackEvent("review_cta_click", { source });
}

const categories = CONTACT_CATEGORIES;

type Status = "idle" | "submitting" | "success" | "error";

const fieldClass =
  "w-full rounded-2xl border border-silver bg-white px-4 py-3 text-charcoal placeholder:text-charcoal/40 focus:border-deep-teal focus:outline-none";
const labelClass = "mb-1.5 block text-sm font-semibold text-charcoal";

/**
 * Contact form. Posts to the server-side /api/contact relay, which forwards
 * to Web3Forms using a server-only key. Falls back to a mailto: link if the
 * relay reports it isn't configured (501), so the form is always functional.
 * Includes a honeypot field for basic spam protection.
 */
export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [category, setCategory] = useState<string>("Booking");
  const wantsCallback = category === "Request a callback" || category === "Booking";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    // Honeypot: bots fill hidden fields.
    if (data.get("botcheck")) return;

    const category = String(data.get("category") ?? "");
    const callbackTime = data.get("callback_time") ? String(data.get("callback_time")) : "";
    const message = String(data.get("message") ?? "");
    const payload = {
      name: `${data.get("first_name") ?? ""} ${data.get("last_name") ?? ""}`.trim(),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      category,
      callback_time: callbackTime,
      message,
      formName: "contact",
    };

    setStatus("submitting");
    setError("");
    setFieldErrors({});

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 501) {
        // Relay isn't configured — fall back to a pre-filled email.
        const subject = `Website enquiry: ${category}`;
        const body = [
          `Name: ${payload.name}`,
          `Email: ${payload.email}`,
          `Phone: ${payload.phone}`,
          `Category: ${category}`,
          ...(callbackTime ? [`Best time to call: ${callbackTime}`] : []),
          "",
          message,
        ].join("\n");
        window.location.href = `mailto:${clinic.email}?subject=${encodeURIComponent(
          subject
        )}&body=${encodeURIComponent(body)}`;
        trackEvent("contact_submit", { method: "mailto" });
        setStatus("idle");
        return;
      }

      if (res.status === 429) {
        const json = await res.json().catch(() => null);
        setStatus("error");
        setError(json?.error || "Too many requests. Please wait a moment and try again.");
        return;
      }

      if (res.status === 400) {
        const json = await res.json().catch(() => null);
        const errors = json?.errors as Record<string, string> | undefined;
        const firstError = errors ? Object.values(errors)[0] : undefined;
        setStatus("error");
        setFieldErrors(errors || {});
        setError(firstError || "Please check the form and try again.");
        return;
      }

      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setStatus("success");
        trackEvent("contact_submit", { method: "relay" });
        form.reset();
      } else {
        setStatus("error");
        setError(json?.error || "Something went wrong. Please call the clinic.");
      }
    } catch {
      setStatus("error");
      setError("Network error. Please try again or call the clinic.");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-mint/50 bg-sage/40 p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-deep-teal" aria-hidden="true" />
        <h3 className="text-xl font-bold text-charcoal">Message sent</h3>
        <p className="text-charcoal/70">
          Thanks for reaching out — our team will get back to you soon. For urgent needs,
          please call {clinic.phone}.
        </p>
        <Link
          href="/review"
          onClick={() => trackReviewCtaClick("contact_success")}
          className="group mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-deep-teal hover:text-deep-teal/80"
        >
          Loved your visit? Leave us a review
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Honeypot */}
      <input
        type="checkbox"
        name="botcheck"
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="first_name" className={labelClass}>
            First name
          </label>
          <input id="first_name" name="first_name" required className={fieldClass} autoComplete="given-name" />
        </div>
        <div>
          <label htmlFor="last_name" className={labelClass}>
            Last name
          </label>
          <input id="last_name" name="last_name" required className={fieldClass} autoComplete="family-name" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className={fieldClass}
            autoComplete="email"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
          />
          {fieldErrors.email && (
            <p id="email-error" className="mt-1 text-xs text-red-600">
              {fieldErrors.email}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className={fieldClass}
            autoComplete="tel"
            aria-invalid={Boolean(fieldErrors.phone)}
            aria-describedby={fieldErrors.phone ? "phone-error" : undefined}
          />
          {fieldErrors.phone && (
            <p id="phone-error" className="mt-1 text-xs text-red-600">
              {fieldErrors.phone}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="category" className={labelClass}>
          What is this about?
        </label>
        <select
          id="category"
          name="category"
          required
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className={fieldClass}
          aria-invalid={Boolean(fieldErrors.category)}
          aria-describedby={fieldErrors.category ? "category-error" : undefined}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {fieldErrors.category && (
          <p id="category-error" className="mt-1 text-xs text-red-600">
            {fieldErrors.category}
          </p>
        )}
      </div>

      {wantsCallback && (
        <div>
          <label htmlFor="callback_time" className={labelClass}>
            Best time to call you back
          </label>
          <select id="callback_time" name="callback_time" defaultValue={CALLBACK_TIMES[0]} className={fieldClass}>
            {CALLBACK_TIMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="message" className={labelClass}>
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className={cn(fieldClass, "resize-y")}
          placeholder="Tell us what's going on and we'll guide you to the right care."
          aria-invalid={Boolean(fieldErrors.message)}
          aria-describedby={fieldErrors.message ? "message-error" : undefined}
        />
        {fieldErrors.message && (
          <p id="message-error" className="mt-1 text-xs text-red-600">
            {fieldErrors.message}
          </p>
        )}
      </div>

      {status === "error" && (
        <p className="flex items-center gap-2 text-sm font-medium text-red-600" role="alert">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          {error}
        </p>
      )}

      <p className="text-xs text-charcoal/70">
        Your message goes directly to our clinic inbox. Please don&apos;t include detailed
        health information here — save that for your appointment or the{" "}
        <Link href="/intake" className="font-semibold text-deep-teal underline underline-offset-2 hover:text-deep-teal/80">
          pre-visit intake form
        </Link>
        .
      </p>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="group inline-flex w-full items-center justify-center gap-2 rounded-pill bg-mint px-7 py-4 text-[17px] font-semibold text-charcoal transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:shadow-button-hover disabled:opacity-60 sm:w-auto"
      >
        {status === "submitting" ? "Sending…" : "Send Message"}
        <Send className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </button>
    </form>
  );
}
