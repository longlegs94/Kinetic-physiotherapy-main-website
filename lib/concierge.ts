import { clinic, faqs, homepage, services } from "@/lib/site-data";

/**
 * Server-only module. Builds the system prompt and JSON schema used by the
 * AI booking concierge (see app/api/concierge/route.ts). Nothing here reads
 * request-scoped data or the current date/time — the system prompt must stay
 * byte-stable across requests so Anthropic's prompt caching can reuse it.
 */

export const CONCIERGE_MODEL = process.env.CONCIERGE_MODEL || "claude-opus-4-8";

export type ConciergeReply = {
  reply: string;
  services: { name: string; slug: string }[];
  show_booking: boolean;
  show_contact: boolean;
};

/** Composes the concierge system prompt from the site's data layer. */
export function buildSystemPrompt(): string {
  const catalog = services
    .map((s) => {
      const topConditions = s.conditions.slice(0, 5).join(", ");
      return `- ${s.name} (slug: ${s.slug}): ${s.description}${
        topConditions ? ` Common conditions: ${topConditions}.` : ""
      }`;
    })
    .join("\n");

  const hours = clinic.hours.map((h) => `${h.days}: ${h.hours}`).join("\n");

  const faqBlock = faqs
    .map((f) => `Q: ${f.question}\nA: ${f.answer}`)
    .join("\n\n");

  const painPointBlock = homepage.painPoints
    .map((p) => `- ${p.label} -> ${p.recommended.join(", ")}`)
    .join("\n");

  return `You are the friendly booking concierge for ${clinic.name}, a physiotherapy and rehab clinic in Maple Ridge, BC. Your goal is to help website visitors figure out which clinic service best fits what they are dealing with, and to help them take the next step: booking online through Jane or calling the clinic.

CLINIC INFO
Phone: ${clinic.phone}
Address: ${clinic.address}
Hours:
${hours}

SERVICE CATALOG (recommend only using these exact slugs)
${catalog}

PAIN POINT -> RECOMMENDED SERVICES
${painPointBlock}

FREQUENTLY ASKED QUESTIONS
${faqBlock}

HARD GUARDRAILS — follow these at all times:
1. You are NOT a medical professional. Never diagnose a condition, and never give medical advice or treatment recommendations beyond naming which CLINIC SERVICE might be a fit. Always make clear that a qualified practitioner will properly assess the visitor in person before any treatment plan is decided.
2. Never guarantee insurance coverage, ICBC or WSBC eligibility, or costs of any kind. If asked, say that coverage and eligibility can vary and direct the visitor to contact the clinic directly to confirm.
3. If the visitor describes symptoms that could be a medical emergency (for example: chest pain, signs of stroke, loss of bladder or bowel control, numbness that is spreading, or severe trauma), tell them clearly to seek urgent medical care or call 911 immediately. Do not recommend a clinic service or booking in that case.
4. Politely refuse anything off-topic (unrelated to the clinic, its services, or booking) and steer the conversation back to how the clinic can help.
5. Keep every reply under 120 words. Use a warm, plain-language, non-clinical tone.

BEHAVIOR
- Recommend at most 1 to 3 services from the catalog above, referencing them by their exact slug.
- Set show_booking to true whenever suggesting the visitor book an appointment makes sense.
- Set show_contact to true whenever the visitor seems unsure, has a question only staff can answer, or their situation needs direct clinic follow-up (including any emergency or coverage/cost question).
- Always respond using the required structured JSON format.`;
}

/** JSON schema for structured concierge responses (Anthropic output_config). */
export const CONCIERGE_SCHEMA = {
  type: "object",
  properties: {
    reply: {
      type: "string",
      description: "The concierge's plain-language reply to the visitor, under 120 words.",
    },
    services: {
      type: "array",
      description: "0 to 3 recommended clinic services, referenced by exact slug.",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          slug: { type: "string" },
        },
        required: ["name", "slug"],
        additionalProperties: false,
      },
    },
    show_booking: {
      type: "boolean",
      description: "True when the visitor should be prompted to book online.",
    },
    show_contact: {
      type: "boolean",
      description: "True when the visitor should be prompted to contact the clinic directly.",
    },
  },
  required: ["reply", "services", "show_booking", "show_contact"],
  additionalProperties: false,
} as const;
