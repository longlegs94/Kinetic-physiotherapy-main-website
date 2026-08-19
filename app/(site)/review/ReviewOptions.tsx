"use client";

import { useState, type FormEvent } from "react";
import { Star, ExternalLink, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { clinic } from "@/lib/site-data";
import { trackEvent } from "@/lib/analytics";
import { googleReviewUrl } from "@/lib/env";
import { cn } from "@/lib/utils";

type Status = "idle" | "submitting" | "success" | "error";

const fieldClass =
  "w-full rounded-2xl border border-silver bg-white px-4 py-3 text-charcoal placeholder:text-charcoal/40 focus:border-deep-teal focus:outline-none";
const labelClass = "mb-1.5 block text-sm font-semibold text-charcoal";

/** Small "leave private feedback" form. Posts to the shared /api/contact relay. */
function FeedbackForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    // Honeypot: bots fill hidden fields.
    if (data.get("botcheck")) return;

    const message = String(data.get("message") ?? "").trim();
    // Name and email are genuinely optional here — the shared /api/contact
    // validation treats them as optional for non-"contact" forms.
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();

    const payload = {
      name,
      email,
      message,
      formName: "feedback",
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
        // Relay isn't configured — fall back to a pre-filled email.
        const subject = "Website feedback";
        const body = [`Name: ${name}`, `Email: ${email}`, "", message].join("\n");
        window.location.href = `mailto:${clinic.email}?subject=${encodeURIComponent(
          subject
        )}&body=${encodeURIComponent(body)}`;
        trackEvent("review_feedback_submit", { method: "mailto" });
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
        setError(firstError || "Please check the form and try again.");
        return;
      }

      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setStatus("success");
        trackEvent("review_feedback_submit", { method: "relay" });
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
      <div className="flex flex-col items-center gap-2 rounded-card border border-mint/50 bg-sage/40 p-6 text-center">
        <CheckCircle2 className="h-8 w-8 text-deep-teal" aria-hidden="true" />
        <h3 className="text-lg font-bold text-charcoal">Thank you</h3>
        <p className="text-sm text-charcoal/70">
          Your feedback goes straight to our clinic team. We appreciate you taking the time.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
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
        <label htmlFor="feedback-name" className={labelClass}>
          Name (optional)
        </label>
        <input id="feedback-name" name="name" className={fieldClass} autoComplete="name" />
      </div>

      <div>
        <label htmlFor="feedback-email" className={labelClass}>
          Email (optional)
        </label>
        <input
          id="feedback-email"
          name="email"
          type="email"
          className={fieldClass}
          autoComplete="email"
          placeholder="Only if you'd like a reply"
        />
      </div>

      <div>
        <label htmlFor="feedback-message" className={labelClass}>
          Your feedback
        </label>
        <textarea
          id="feedback-message"
          name="message"
          rows={4}
          required
          className={cn(fieldClass, "resize-y")}
          placeholder="Tell us how your visit went."
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
        className="group inline-flex w-full items-center justify-center gap-2 rounded-pill border-2 border-deep-teal bg-transparent px-6 py-3 text-[15px] font-semibold text-deep-teal transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:bg-deep-teal hover:text-warm-white disabled:opacity-60"
      >
        {status === "submitting" ? "Sending…" : "Send private feedback"}
        <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </button>
    </form>
  );
}

/**
 * Two equal, always-visible options — leave a Google review, or share
 * private feedback. No gating: both paths are shown to every visitor
 * regardless of how they answer, per Google's review-gating policy.
 */
export function ReviewOptions() {
  // When NEXT_PUBLIC_GOOGLE_REVIEW_URL isn't configured (or is still a
  // placeholder) the Google card is omitted entirely rather than rendered
  // with a dead link — a button that lands on a Google error page is worse
  // than no button, and the private-feedback path still works. The production
  // build additionally refuses to ship a malformed value; see lib/env.ts.
  // Bound to a local so TypeScript narrows the null away inside the branch.
  const reviewUrl = googleReviewUrl;

  return (
    <div className={cn("grid gap-6", reviewUrl && "sm:grid-cols-2")}>
      {reviewUrl && (
        <div className="flex flex-col items-center gap-4 rounded-panel border border-silver/60 bg-warm-white p-6 text-center shadow-card sm:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-mint/30 text-deep-teal">
            <Star className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-charcoal">Leave a Google review</h2>
            <p className="mt-1.5 text-sm text-charcoal/65">
              Takes under a minute, and helps other people in Maple Ridge find us.
            </p>
          </div>
          <a
            href={reviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("review_google_click")}
            className="group mt-auto inline-flex w-full items-center justify-center gap-2 rounded-pill bg-mint px-6 py-3.5 text-[15px] font-semibold text-charcoal transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:shadow-button-hover"
          >
            Leave a Google review
            <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </a>
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-panel border border-silver/60 bg-warm-white p-6 shadow-card sm:p-8">
        <div className="text-center">
          <h2 className="text-lg font-bold text-charcoal">Share private feedback</h2>
          <p className="mt-1.5 text-sm text-charcoal/65">
            Goes straight to our clinic team — not posted publicly.
          </p>
        </div>
        <FeedbackForm />
      </div>
    </div>
  );
}
