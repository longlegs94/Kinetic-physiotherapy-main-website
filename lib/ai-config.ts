/**
 * Single source of truth for whether the AI assistant is switched on.
 *
 * Three surfaces use the assistant — the "Describe it in your own words" box
 * (components/concierge/SymptomRouter), the site-wide chat bubble
 * (components/concierge/ConciergeWidget), and the "Ask our assistant" button
 * under the FAQs — plus the pre-visit intake summary. All of them consult
 * this module so the clinic has one switch rather than four.
 *
 * The flag is NEXT_PUBLIC_ deliberately. It is a boolean feature switch, not
 * a secret, and being public lets the same value drive two different things
 * from one setting:
 *
 *  - Server components read `aiAssistantEnabled` at build time, so a disabled
 *    assistant is absent from the HTML entirely rather than appearing and
 *    then vanishing once a client-side check resolves. No flash, no layout
 *    shift, and no dead input box for a visitor to type into.
 *  - The API routes call `isAiAssistantAvailable()` at request time, which
 *    additionally requires the API key to actually be present. This is the
 *    enforcing layer: even a stale cached page or a hand-crafted request gets
 *    a 503 when the assistant is off.
 *
 * Turning it off never breaks a page. Every AI surface sits alongside a
 * non-AI path that does the same job — the pain-point buttons, the FAQ
 * accordion, the phone number — so the site degrades to those.
 */

/**
 * Reads a human-friendly on/off value. Absent or empty means on, so an
 * existing deployment that has never set the variable keeps its assistant.
 * Accepts the spellings someone is likely to type into a Vercel settings box.
 */
function parseToggle(raw: string | undefined): boolean {
  const value = raw?.trim().toLowerCase();
  if (value === undefined || value === "") return true;
  return !(value === "0" || value === "false" || value === "off" || value === "no");
}

/** Exported for tests, which cover the spellings the clinic might use. */
export const __parseToggle = parseToggle;

/**
 * Whether the assistant's UI should render. Safe in client components and in
 * server components; the bundler inlines the literal member expression below
 * at build time, so this must stay a direct `process.env.NEXT_PUBLIC_…` read.
 */
export const aiAssistantEnabled: boolean = parseToggle(
  process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED
);

/**
 * Whether the API routes should actually serve AI requests. Server-side only:
 * requires both the switch to be on and a key to be configured, so a deploy
 * with the switch on but no key still reports itself unavailable rather than
 * failing on every call.
 */
export function isAiAssistantAvailable(env: AiEnv = process.env): boolean {
  if (!env.OPENAI_API_KEY?.trim()) return false;
  return parseToggle(env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED);
}

/**
 * The slice of the environment this module reads. Indexed rather than a
 * closed object type so `process.env` (whose ProcessEnv carries an index
 * signature and no declared members) satisfies it, while tests can still pass
 * a plain object with just these keys.
 */
export type AiEnv = {
  OPENAI_API_KEY?: string;
  NEXT_PUBLIC_AI_ASSISTANT_ENABLED?: string;
  [key: string]: string | undefined;
};
