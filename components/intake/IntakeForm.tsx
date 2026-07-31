"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Pencil, Send } from "lucide-react";
import { clinic } from "@/lib/site-data";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Pain or injury",
  "Car accident (ICBC)",
  "Massage or relaxation",
  "Work injury (WSBC)",
  "Other",
];

const fieldClass =
  "w-full rounded-2xl border border-silver bg-white px-4 py-3 text-charcoal placeholder:text-charcoal/40 focus:border-deep-teal focus:outline-none";
const labelClass = "mb-1.5 block text-sm font-semibold text-charcoal";

type Fields = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  category: string;
  concern: string;
  onset: string;
  modifiers: string;
  painLevel: string;
  goals: string;
  icbcClaim: string;
};

const EMPTY_FIELDS: Fields = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  category: CATEGORIES[0],
  concern: "",
  onset: "",
  modifiers: "",
  painLevel: "",
  goals: "",
  icbcClaim: "",
};

type AiSummary = {
  summary: string;
  key_points: string[];
  suggested_services: { name: string; slug: string }[];
  flags: string[];
};

type Phase = "form" | "review" | "sent";

/** Raw answers as label/value pairs, skipping empties. */
function answerPairs(f: Fields): [string, string][] {
  return (
    [
      ["Name", `${f.firstName} ${f.lastName}`.trim()],
      ["Email", f.email],
      ["Phone", f.phone],
      ["Reason for visit", f.category],
      ["Main concern", f.concern],
      ["Started", f.onset],
      ["Better / worse with", f.modifiers],
      ["Pain level (0–10)", f.painLevel],
      ["Goals", f.goals],
      ["ICBC claim", f.icbcClaim],
    ] as [string, string][]
  ).filter(([, v]) => v.length > 0);
}

function buildDeliveryText(f: Fields, ai: AiSummary | null): string {
  const lines: string[] = [];
  if (ai) {
    lines.push("PRE-VISIT SUMMARY (AI-drafted from patient-reported answers)", "", ai.summary, "");
    if (ai.key_points.length) {
      lines.push("Key points:");
      ai.key_points.forEach((p) => lines.push(`- ${p}`));
      lines.push("");
    }
    if (ai.flags.length) {
      lines.push("For staff review:");
      ai.flags.forEach((fl) => lines.push(`- ${fl}`));
      lines.push("");
    }
    lines.push("----------------------------------------", "");
  }
  lines.push("RAW ANSWERS AS SUBMITTED:");
  answerPairs(f).forEach(([k, v]) => lines.push(`${k}: ${v}`));
  return lines.join("\n");
}

/**
 * Pre-visit intake: guided form → AI-drafted summary the visitor reviews →
 * sent to the clinic via Web3Forms (mailto fallback). Works without the AI
 * key by sending the raw answers instead.
 */
export function IntakeForm() {
  const [phase, setPhase] = useState<Phase>("form");
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS);
  const [ai, setAi] = useState<AiSummary | null>(null);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [pending, setPending] = useState(false);
  const [sendError, setSendError] = useState("");

  function set<K extends keyof Fields>(key: K, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handlePrepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get("botcheck")) return; // honeypot

    setPending(true);
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intake: {
            category: fields.category,
            concern: fields.concern,
            onset: fields.onset,
            modifiers: fields.modifiers,
            painLevel: fields.painLevel,
            goals: fields.goals,
            icbcClaim: fields.icbcClaim,
          },
        }),
      });
      if (res.ok) {
        setAi((await res.json()) as AiSummary);
        setAiUnavailable(false);
      } else {
        setAi(null);
        setAiUnavailable(true);
      }
    } catch {
      setAi(null);
      setAiUnavailable(true);
    } finally {
      setPending(false);
      setPhase("review");
    }
  }

  async function handleSend() {
    setSendError("");
    const subject = `Pre-visit intake — ${fields.firstName} ${fields.lastName}`.trim();
    const message = buildDeliveryText(fields, ai);
    const name = `${fields.firstName} ${fields.lastName}`.trim() || "Website visitor";
    const email = fields.email || clinic.email;

    setPending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: fields.phone,
          category: fields.category,
          message,
          subject,
          formName: "intake",
        }),
      });

      if (res.status === 501) {
        // Relay isn't configured — fall back to a pre-filled email.
        window.location.href = `mailto:${clinic.email}?subject=${encodeURIComponent(
          subject
        )}&body=${encodeURIComponent(message)}`;
        trackEvent("intake_submit", { method: "mailto" });
        setPhase("sent");
        return;
      }

      if (res.status === 429) {
        const json = await res.json().catch(() => null);
        setSendError(json?.error || "Too many requests. Please wait a moment and try again.");
        return;
      }

      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        trackEvent("intake_submit", { method: "relay" });
        setPhase("sent");
      } else {
        setSendError(`Something went wrong. Please call us at ${clinic.phone}.`);
      }
    } catch {
      setSendError(`Network error. Please try again or call ${clinic.phone}.`);
    } finally {
      setPending(false);
    }
  }

  if (phase === "sent") {
    return (
      <div
        className="flex flex-col items-center gap-3 rounded-card border border-mint/50 bg-sage/40 p-8 text-center"
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 className="h-10 w-10 text-deep-teal" aria-hidden="true" />
        <h3 className="text-xl font-bold text-charcoal">Thanks — we&apos;ll see you soon!</h3>
        <p className="text-charcoal/70">
          Your pre-visit summary was sent. If anything changes before your appointment,
          just call us at {clinic.phone}.
        </p>
      </div>
    );
  }

  if (phase === "review") {
    return (
      <div className="glass rounded-panel p-6 sm:p-8" aria-live="polite">
        <h3 className="font-heading text-xl font-bold text-charcoal">
          Review your pre-visit summary
        </h3>

        {aiUnavailable && (
          <p className="mt-2 text-sm text-charcoal/60">
            Our assistant couldn&apos;t summarize right now — we&apos;ll send your answers
            as written.
          </p>
        )}

        {ai ? (
          <div className="mt-5 space-y-4">
            <p className="text-[15px] leading-relaxed text-charcoal/85">{ai.summary}</p>
            {ai.key_points.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-[15px] text-charcoal/75">
                {ai.key_points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}
            {ai.flags.length > 0 && (
              <div className="rounded-2xl bg-sage/50 p-4 text-sm text-charcoal/75">
                <span className="font-semibold text-deep-teal">For our team to review: </span>
                {ai.flags.join(" · ")}
              </div>
            )}
            <p className="text-xs text-charcoal/50">
              Patient-reported information — our practitioner will confirm everything with
              you in person.
            </p>
          </div>
        ) : (
          <dl className="mt-5 space-y-2 text-[15px]">
            {answerPairs(fields).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="shrink-0 font-semibold text-charcoal">{k}:</dt>
                <dd className="text-charcoal/75">{v}</dd>
              </div>
            ))}
          </dl>
        )}

        {sendError && (
          <p className="mt-4 text-sm font-medium text-red-600" role="alert">
            {sendError}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={pending}
            className="group inline-flex items-center justify-center gap-2 rounded-pill bg-mint px-7 py-4 text-[17px] font-semibold text-charcoal transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:shadow-button-hover disabled:opacity-60"
          >
            {pending ? "Sending…" : "Send to clinic"}
            <Send className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setPhase("form")}
            className="inline-flex items-center justify-center gap-2 rounded-pill border border-charcoal/25 px-7 py-4 text-[17px] font-semibold text-charcoal transition-colors hover:border-deep-teal"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit answers
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handlePrepare} className="space-y-4">
      {/* Honeypot */}
      <input type="checkbox" name="botcheck" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="in-first" className={labelClass}>First name</label>
          <input id="in-first" required value={fields.firstName} onChange={(e) => set("firstName", e.target.value)} className={fieldClass} autoComplete="given-name" />
        </div>
        <div>
          <label htmlFor="in-last" className={labelClass}>Last name</label>
          <input id="in-last" required value={fields.lastName} onChange={(e) => set("lastName", e.target.value)} className={fieldClass} autoComplete="family-name" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="in-email" className={labelClass}>Email (optional)</label>
          <input id="in-email" type="email" value={fields.email} onChange={(e) => set("email", e.target.value)} className={fieldClass} autoComplete="email" />
        </div>
        <div>
          <label htmlFor="in-phone" className={labelClass}>Phone (optional)</label>
          <input id="in-phone" type="tel" value={fields.phone} onChange={(e) => set("phone", e.target.value)} className={fieldClass} autoComplete="tel" />
        </div>
      </div>

      <div>
        <label htmlFor="in-category" className={labelClass}>What brings you in?</label>
        <select id="in-category" required value={fields.category} onChange={(e) => set("category", e.target.value)} className={fieldClass}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="in-concern" className={labelClass}>Tell us about your main concern</label>
        <textarea id="in-concern" required rows={4} maxLength={1000} value={fields.concern} onChange={(e) => set("concern", e.target.value)} className={cn(fieldClass, "resize-y")} placeholder="What's bothering you, where, and how it affects your day" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="in-onset" className={labelClass}>When did it start? (optional)</label>
          <input id="in-onset" maxLength={200} value={fields.onset} onChange={(e) => set("onset", e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="in-pain" className={labelClass}>Pain level right now (0–10, optional)</label>
          <select id="in-pain" value={fields.painLevel} onChange={(e) => set("painLevel", e.target.value)} className={fieldClass}>
            <option value="">Prefer not to say</option>
            {Array.from({ length: 11 }, (_, i) => (
              <option key={i} value={String(i)}>{i}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="in-modifiers" className={labelClass}>What makes it better or worse? (optional)</label>
        <input id="in-modifiers" maxLength={300} value={fields.modifiers} onChange={(e) => set("modifiers", e.target.value)} className={fieldClass} />
      </div>

      <div>
        <label htmlFor="in-goals" className={labelClass}>What would you like to get back to? (optional)</label>
        <input id="in-goals" maxLength={300} value={fields.goals} onChange={(e) => set("goals", e.target.value)} className={fieldClass} placeholder="e.g. running, lifting my kids, sleeping through the night" />
      </div>

      <div>
        <label htmlFor="in-icbc" className={labelClass}>ICBC claim number (if any)</label>
        <input id="in-icbc" maxLength={60} value={fields.icbcClaim} onChange={(e) => set("icbcClaim", e.target.value)} className={fieldClass} />
      </div>

      <div className="rounded-2xl bg-sage/40 p-4">
        <label className="flex items-start gap-3 text-sm text-charcoal/80">
          <input type="checkbox" required className="mt-1 h-4 w-4 accent-teal-700" />
          <span>
            I understand this form sends health information to Kinetic Therapy Clinic to
            prepare for my visit, and that it is not monitored for urgent medical needs.
          </span>
        </label>
        <p className="mt-2 pl-7 text-xs text-charcoal/55">
          If you have urgent symptoms, call 911 or visit an emergency department.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="group inline-flex w-full items-center justify-center gap-2 rounded-pill bg-mint px-7 py-4 text-[17px] font-semibold text-charcoal transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:shadow-button-hover disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Preparing…" : "Prepare my summary"}
      </button>
    </form>
  );
}
