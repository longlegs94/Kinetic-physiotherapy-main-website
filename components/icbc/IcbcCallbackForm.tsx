"use client";

import { useState, type FormEvent } from "react";
import { Send, CheckCircle2, AlertCircle, PhoneCall } from "lucide-react";
import { clinic } from "@/lib/site-data";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { CALLBACK_TIMES, isCallablePhone } from "@/lib/contact";

type Status = "idle" | "submitting" | "success" | "error";

const fieldClass =
  "w-full rounded-2xl border border-silver bg-white px-4 py-3 text-charcoal placeholder:text-charcoal/40 focus:border-deep-teal focus:outline-none";
const labelClass = "mb-1.5 block text-sm font-semibold text-charcoal";

/**
 * Self-contained callback request form for the /icbc-claims paid-traffic
 * landing page. Deliberately separate from components/cards/ContactForm.tsx
 * — different field set (ICBC claim number, phone-first) and its own
 * analytics event. Posts JSON to the shared /api/contact relay with
 * formName "icbc-callback". Mirrors ContactForm's status/error handling
 * (idle/submitting/success/error, 429, 501 mailto fallback) so behaviour
 * stays consistent across the site.
 */
export function IcbcCallbackForm({ id = "callback-form" }: { id?: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    // Honeypot: bots fill hidden fields. Pretend nothing happened.
    if (data.get("botcheck")) return;

    const name = String(data.get("name") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const claimNumber = String(data.get("claim_number") ?? "").trim();
    const callbackTime = String(data.get("callback_time") ?? "").trim();
    const note = String(data.get("message") ?? "").trim();

    // A callback request without a name and a dialable number is useless to
    // the clinic. The <input required> attributes cover the normal path, but
    // they're skipped on programmatic submits, so mirror the server rule here
    // for a fast, specific error instead of a round-trip 400.
    if (!name) {
      setStatus("error");
      setError("Please enter your name so we know who to ask for.");
      return;
    }
    if (!isCallablePhone(phone)) {
      setStatus("error");
      setError("Please enter a phone number we can reach you at.");
      return;
    }

    // Message is required by the shared relay's validation, so always send
    // something useful even if the optional note field is left blank.
    const message =
      [
        note,
        claimNumber ? `ICBC claim number: ${claimNumber}` : "",
        callbackTime ? `Best time to call: ${callbackTime}` : "",
      ]
        .filter(Boolean)
        .join("\n") ||
      "Requesting a callback about my ICBC claim after a motor vehicle accident.";

    const subject = `ICBC ads callback request${name ? ` — ${name}` : ""}`;

    const payload = {
      name,
      email,
      phone,
      category: "ICBC",
      callback_time: callbackTime,
      claim_number: claimNumber,
      message,
      subject,
      formName: "icbc-callback",
    };

    setStatus("submitting");
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 501) {
        // Relay isn't configured — fall back to a pre-filled email so the
        // page still converts.
        const body = [
          `Name: ${name}`,
          `Email: ${email}`,
          `Phone: ${phone}`,
          claimNumber ? `ICBC claim number: ${claimNumber}` : "",
          callbackTime ? `Best time to call: ${callbackTime}` : "",
          "",
          note,
        ]
          .filter(Boolean)
          .join("\n");
        window.location.href = `mailto:${clinic.email}?subject=${encodeURIComponent(
          subject
        )}&body=${encodeURIComponent(body)}`;
        trackEvent("icbc_callback_submit", { method: "mailto" });
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
        setError(
          firstError ||
            "Please check the form and try again — or just call us, that's faster anyway."
        );
        return;
      }

      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setStatus("success");
        trackEvent("icbc_callback_submit", { method: "relay" });
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
      <div
        id={id}
        className="flex scroll-mt-24 flex-col items-center gap-3 rounded-card border border-mint/50 bg-sage/40 p-8 text-center"
      >
        <CheckCircle2 className="h-10 w-10 text-deep-teal" aria-hidden="true" />
        <h3 className="text-xl font-bold text-charcoal">Request received</h3>
        <p className="text-charcoal/70">
          Thanks — our team will reach out to help you understand your next steps. For
          faster help right now, call {clinic.phone}.
        </p>
      </div>
    );
  }

  return (
    <form
      id={id}
      onSubmit={handleSubmit}
      className="scroll-mt-24 space-y-4 rounded-card border border-silver/60 bg-white p-6 shadow-card sm:p-8"
      noValidate
      aria-label="Request an ICBC callback"
    >
      <div>
        <h3 className="text-xl font-bold text-charcoal">Request a callback</h3>
        <p className="mt-1 text-sm text-charcoal/60">
          Prefer us to call you? Leave your details and our team will reach out to help you
          understand your next steps.
        </p>
      </div>

      {/* Honeypot */}
      <input
        type="checkbox"
        name="botcheck"
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <div>
        <label htmlFor="icbc-name" className={labelClass}>
          Full name
        </label>
        <input
          id="icbc-name"
          name="name"
          required
          className={fieldClass}
          autoComplete="name"
          placeholder="Your name"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="icbc-phone" className={labelClass}>
            Phone
          </label>
          <input
            id="icbc-phone"
            name="phone"
            type="tel"
            required
            className={fieldClass}
            autoComplete="tel"
            placeholder="(604) 555-0123"
          />
        </div>
        <div>
          <label htmlFor="icbc-email" className={labelClass}>
            Email <span className="font-normal text-charcoal/40">(optional)</span>
          </label>
          <input
            id="icbc-email"
            name="email"
            type="email"
            className={fieldClass}
            autoComplete="email"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="icbc-claim" className={labelClass}>
            ICBC claim number <span className="font-normal text-charcoal/40">(optional)</span>
          </label>
          <input
            id="icbc-claim"
            name="claim_number"
            className={fieldClass}
            placeholder="If you have one"
          />
        </div>
        <div>
          <label htmlFor="icbc-callback-time" className={labelClass}>
            Best time to call <span className="font-normal text-charcoal/40">(optional)</span>
          </label>
          <select id="icbc-callback-time" name="callback_time" defaultValue="" className={fieldClass}>
            <option value="">No preference</option>
            {CALLBACK_TIMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="icbc-message" className={labelClass}>
          Anything else we should know?{" "}
          <span className="font-normal text-charcoal/40">(optional)</span>
        </label>
        <textarea
          id="icbc-message"
          name="message"
          rows={3}
          className={cn(fieldClass, "resize-y")}
          placeholder="E.g. when the accident happened, or what's bothering you most"
        />
      </div>

      {status === "error" && (
        <p className="flex items-center gap-2 text-sm font-medium text-red-600" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="group inline-flex w-full items-center justify-center gap-2 rounded-pill bg-mint px-7 py-4 text-[17px] font-semibold text-charcoal transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:shadow-button-hover disabled:opacity-60"
      >
        {status === "submitting" ? "Sending…" : "Request a Callback"}
        <Send
          className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </button>

      <p className="flex items-center gap-1.5 text-xs text-charcoal/50">
        <PhoneCall className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Need help sooner? Call {clinic.phone} directly.
      </p>
    </form>
  );
}
