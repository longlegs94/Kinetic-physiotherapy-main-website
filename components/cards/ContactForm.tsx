"use client";

import { useState, type FormEvent } from "react";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import { clinic } from "@/lib/site-data";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const categories = ["Booking", "Inquiry", "ICBC", "WSBC", "Complaint", "Other"];

type Status = "idle" | "submitting" | "success" | "error";

const WEB3FORMS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY;

const fieldClass =
  "w-full rounded-2xl border border-silver bg-white px-4 py-3 text-charcoal placeholder:text-charcoal/40 focus:border-deep-teal focus:outline-none";
const labelClass = "mb-1.5 block text-sm font-semibold text-charcoal";

/**
 * Contact form. Posts to Web3Forms when NEXT_PUBLIC_WEB3FORMS_KEY is set;
 * otherwise renders a mailto: fallback so the form is always functional.
 * Includes a honeypot field for basic spam protection.
 */
export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    // Honeypot: bots fill hidden fields.
    if (data.get("botcheck")) return;

    if (!WEB3FORMS_KEY) {
      // Fallback: open a pre-filled email.
      const subject = `Website enquiry: ${data.get("category")}`;
      const body = [
        `Name: ${data.get("first_name")} ${data.get("last_name")}`,
        `Email: ${data.get("email")}`,
        `Phone: ${data.get("phone")}`,
        `Category: ${data.get("category")}`,
        "",
        `${data.get("message")}`,
      ].join("\n");
      window.location.href = `mailto:${clinic.email}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
      trackEvent("contact_submit", { method: "mailto" });
      return;
    }

    setStatus("submitting");
    setError("");
    data.append("access_key", WEB3FORMS_KEY);
    data.append("subject", `Website enquiry (${data.get("category")}) — Kinetic Therapy`);
    data.append("from_name", "Kinetic Therapy Website");

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (json.success) {
        setStatus("success");
        trackEvent("contact_submit", { method: "web3forms" });
        form.reset();
      } else {
        setStatus("error");
        setError(json.message || "Something went wrong. Please call the clinic.");
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
          <input id="email" name="email" type="email" required className={fieldClass} autoComplete="email" />
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>
            Phone
          </label>
          <input id="phone" name="phone" type="tel" className={fieldClass} autoComplete="tel" />
        </div>
      </div>

      <div>
        <label htmlFor="category" className={labelClass}>
          What is this about?
        </label>
        <select id="category" name="category" required defaultValue="Booking" className={fieldClass}>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

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
        />
      </div>

      {status === "error" && (
        <p className="flex items-center gap-2 text-sm font-medium text-red-600" role="alert">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="group inline-flex w-full items-center justify-center gap-2 rounded-pill bg-mint px-7 py-4 text-[17px] font-semibold text-charcoal transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:shadow-button-hover disabled:opacity-60 sm:w-auto"
      >
        {status === "submitting" ? "Sending…" : "Send Message"}
        <Send className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </button>

      {!WEB3FORMS_KEY && (
        // Visible only in development / before the key is configured.
        <p className="text-xs text-charcoal/50">
          {/* TODO(setup): add NEXT_PUBLIC_WEB3FORMS_KEY to enable in-page sending.
              Until then this opens the visitor's email app. */}
          Submitting opens your email app pre-filled to {clinic.email}.
        </p>
      )}
    </form>
  );
}
