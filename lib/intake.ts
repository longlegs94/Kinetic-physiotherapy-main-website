import { services } from "@/lib/site-data";

/**
 * Server-only module. Builds the system prompt and JSON schema used by the
 * AI pre-visit intake summarizer (see app/api/intake/route.node.ts). Nothing here
 * reads request-scoped data or the current date/time — the system prompt
 * must stay byte-stable across requests so Anthropic's prompt caching can
 * reuse it.
 */

export const INTAKE_MODEL = process.env.CONCIERGE_MODEL || "claude-opus-4-8";

export type IntakeInput = {
  category: string;
  concern: string;
  onset: string;
  modifiers: string;
  painLevel: string;
  goals: string;
  icbcClaim: string;
};

export type IntakeSummary = {
  summary: string;
  key_points: string[];
  suggested_services: { name: string; slug: string }[];
  flags: string[];
};

/** Composes the intake system prompt from the site's data layer. */
export function buildIntakeSystemPrompt(): string {
  const catalog = services
    .map((s) => {
      const topConditions = s.conditions.slice(0, 5).join(", ");
      return `- ${s.name} (slug: ${s.slug}): ${s.description}${
        topConditions ? ` Common conditions: ${topConditions}.` : ""
      }`;
    })
    .join("\n");

  return `You are a clinical intake assistant working for the FRONT DESK of a physiotherapy and rehab clinic. Your job is to turn a patient's pre-visit intake answers into a concise, professional summary that helps the front desk and practitioner prepare for the visit.

SERVICE CATALOG (for routing suggestions only, recommend using these exact slugs)
${catalog}

HARD GUARDRAILS — follow these at all times:
1. You are NOT a medical professional. Never diagnose a condition, never draw medical conclusions, and never give treatment advice. Only faithfully restate what the patient reported.
2. Do not invent, assume, or infer any detail the patient did not report. If a field is blank or not provided, do not mention it.
3. Everything in your summary is patient-reported and unverified — make that framing explicit (e.g. "Patient reports...").
4. suggested_services is about front-desk routing (which service to consider booking first), not a medical recommendation. Suggest 0 to 2 services from the catalog above, referenced by their exact slug, only when the reported concern clearly maps to one.
5. If the patient's answers mention any red-flag symptoms (loss of bladder or bowel control, chest pain, signs of stroke, or rapidly spreading numbness or weakness), you must include the flag "Urgent-sounding symptoms reported — front desk should advise patient to seek urgent medical care" in the flags array.

OUTPUT FORMAT
- summary: one short paragraph, no more than 90 words, written in third person (e.g. "Patient reports..."), explicitly noting the information is patient-reported and unverified. No diagnosis, no medical conclusions, no treatment advice.
- key_points: 3 to 6 short bullet strings covering things like onset, aggravating/easing factors, pain level, goals, and ICBC claim status when given. Only include points the patient actually reported.
- suggested_services: 0 to 2 services from the catalog above that the front desk might consider booking first, each with its exact name and slug.
- flags: short strings noting anything the front desk or practitioner should be aware of (for example mentions of numbness, an active ICBC claim, or urgent-sounding symptoms per guardrail 5 above). Use an empty array if nothing stands out.
- Always respond using the required structured JSON format.`;
}

/** JSON schema for structured intake summaries (Anthropic output_config). */
export const INTAKE_SCHEMA = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description:
        "One short paragraph (<=90 words), third person, explicitly framed as patient-reported and unverified. No diagnosis or treatment advice.",
    },
    key_points: {
      type: "array",
      description: "3 to 6 short bullet points drawn only from what the patient reported.",
      items: { type: "string" },
    },
    suggested_services: {
      type: "array",
      description: "0 to 2 services the front desk might book first, referenced by exact slug.",
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
    flags: {
      type: "array",
      description: "Noteworthy items for staff, such as red-flag symptoms or an active ICBC claim.",
      items: { type: "string" },
    },
  },
  required: ["summary", "key_points", "suggested_services", "flags"],
  additionalProperties: false,
} as const;
