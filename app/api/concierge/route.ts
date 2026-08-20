import OpenAI, { APIError, RateLimitError } from "openai";
import { NextResponse } from "next/server";

import {
  CONCIERGE_MODEL,
  CONCIERGE_SCHEMA,
  CONCIERGE_SCHEMA_NAME,
  buildSystemPrompt,
  type ConciergeReply,
} from "@/lib/concierge";
import { signReply, signingConfigured, verifyReply } from "@/lib/message-auth";
import { isAiAssistantAvailable } from "@/lib/ai-config";
import { checkRateLimit } from "@/lib/rate-limit";
import { detectRedFlags, emergencyMessage } from "@/lib/red-flags";
import { getClientIp, isAllowedOrigin, readJsonObject } from "@/lib/request";
import { services } from "@/lib/site-data";
import { getClinic } from "@/lib/content/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Module scope: constructed once per server instance, and reused across
// requests. The explicit timeout bounds how long a hung upstream can pin a
// serverless invocation open.
//
// Unlike the Anthropic SDK this replaced, OpenAI's client throws
// synchronously at construction if it finds no API key anywhere — which
// would fail the build itself (Next.js evaluates this module while
// collecting route config) on a deploy that hasn't set OPENAI_API_KEY yet,
// something this site is explicitly designed to tolerate everywhere else
// (see the not_configured check in POST below, and GET's `enabled` flag).
// The placeholder keeps construction from throwing; it is never used to make
// a real request, since POST returns 503 before reaching client.chat.
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-not-configured",
  timeout: 20_000,
  maxRetries: 1,
});

// Module scope so the system prompt text is byte-stable across requests,
// which lets OpenAI's automatic prompt caching reuse the cached prefix.

const VALID_SLUGS = new Set(services.map((s) => s.slug));

const MAX_TURNS = 20;
const MAX_CONTENT_LENGTH = 2000;

type IncomingMessage = { role: "user" | "assistant"; content: string; signature?: unknown };

function isValidMessages(value: unknown): value is IncomingMessage[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_TURNS) {
    return false;
  }

  for (const item of value) {
    if (typeof item !== "object" || item === null) return false;
    const { role, content } = item as Record<string, unknown>;
    if (role !== "user" && role !== "assistant") return false;
    if (typeof content !== "string") return false;
    if (content.length === 0 || content.length > MAX_CONTENT_LENGTH) return false;
  }

  const last = value[value.length - 1] as Record<string, unknown>;
  if (last.role !== "user") return false;

  return true;
}

function sanitizeReply(parsed: ConciergeReply): ConciergeReply {
  const seen = new Set<string>();
  const cleanServices: { name: string; slug: string }[] = [];

  for (const service of parsed.services ?? []) {
    if (!service || typeof service.slug !== "string") continue;
    if (!VALID_SLUGS.has(service.slug)) continue;
    if (seen.has(service.slug)) continue;
    seen.add(service.slug);
    cleanServices.push({ name: service.name, slug: service.slug });
    if (cleanServices.length >= 3) break;
  }

  return {
    reply: typeof parsed.reply === "string" ? parsed.reply : "",
    services: cleanServices,
    show_booking: Boolean(parsed.show_booking),
    show_contact: Boolean(parsed.show_contact),
  };
}

/**
 * Keeps only assistant turns the server itself issued, verified by HMAC.
 * Unsigned or tampered assistant turns are dropped rather than rejected, so a
 * stale transcript degrades to less context instead of a hard error the
 * visitor can't clear. See lib/message-auth.ts.
 */
function keepAuthenticTurns(messages: IncomingMessage[]): {
  history: { role: "user" | "assistant"; content: string }[];
  dropped: number;
} {
  const history: { role: "user" | "assistant"; content: string }[] = [];
  let dropped = 0;

  messages.forEach((message, index) => {
    if (message.role === "user") {
      history.push({ role: "user", content: message.content });
      return;
    }
    if (verifyReply(message.content, index, message.signature)) {
      history.push({ role: "assistant", content: message.content });
    } else {
      dropped += 1;
    }
  });

  return { history, dropped };
}

export async function GET() {
  return NextResponse.json({ enabled: isAiAssistantAvailable() });
}

export async function POST(request: Request) {
  // Read per request: the prompt quotes the clinic's live hours, phone and
  // address, and a module constant would freeze them at deploy time.
  const clinic = await getClinic();
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ip = getClientIp(request);
  const [perMinute, perHour] = await Promise.all([
    checkRateLimit(`concierge:min:${ip}`, { limit: 10, windowMs: 60_000 }),
    checkRateLimit(`concierge:hr:${ip}`, { limit: 60, windowMs: 3_600_000 }),
  ]);
  if (!perMinute.allowed || !perHour.allowed) {
    const retryAfterSeconds = Math.max(perMinute.retryAfterSeconds, perHour.retryAfterSeconds);
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  // Covers both "no key" and "clinic switched the assistant off". The UI
  // already hides itself in that case; this is the enforcing layer, so a
  // cached page or a direct request cannot keep the feature running.
  if (!isAiAssistantAvailable()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const body = await readJsonObject(request);
  if (!body.ok) {
    const status = body.reason === "too_large" ? 413 : 400;
    return NextResponse.json({ error: "invalid_request" }, { status });
  }

  const messages = body.value.messages;
  if (!isValidMessages(messages)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  // Emergency screening runs before the model, on the visitor's own words
  // only, and its verdict is final — see lib/red-flags.ts. Nothing about the
  // matched text is logged.
  const latestUserTurn = messages[messages.length - 1].content;
  const redFlags = detectRedFlags(latestUserTurn);
  if (redFlags.triggered) {
    const reply = emergencyMessage(redFlags.categories, clinic.phone);
    return NextResponse.json({
      reply,
      signature: signReply(reply, messages.length),
      services: [],
      show_booking: false,
      show_contact: true,
      emergency: true,
    });
  }

  const { history } = keepAuthenticTurns(messages);

  // Dropping unverified assistant turns (see keepAuthenticTurns above) can
  // leave a leading assistant message behind; trim back to the first real
  // user turn so the conversation sent upstream always opens with the
  // visitor's own words.
  const firstUserIndex = history.findIndex((m) => m.role === "user");
  const conversation = firstUserIndex === -1 ? [] : history.slice(firstUserIndex);

  if (conversation.length === 0) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    const response = await client.chat.completions.create({
      model: CONCIERGE_MODEL,
      max_completion_tokens: 1024,
      messages: [{ role: "system", content: buildSystemPrompt(clinic) }, ...conversation],
      response_format: {
        type: "json_schema",
        json_schema: { name: CONCIERGE_SCHEMA_NAME, schema: CONCIERGE_SCHEMA, strict: true },
      },
    });

    const fallback = (text: string) =>
      NextResponse.json({
        reply: text,
        signature: signReply(text, messages.length),
        services: [],
        show_booking: false,
        show_contact: true,
      });

    const message = response.choices[0]?.message;

    // Structured Outputs' refusal path: the model declines and explains why
    // in `refusal` instead of filling the schema. Equivalent to Anthropic's
    // stop_reason === "refusal" in the previous version of this route.
    if (message?.refusal) {
      return fallback(`I can't help with that here — please call the clinic at ${clinic.phone}.`);
    }

    const text = message?.content ?? "";

    let parsed: ConciergeReply;
    try {
      parsed = JSON.parse(text) as ConciergeReply;
    } catch {
      return fallback(
        "Sorry, I had trouble putting that together. Please try again, or feel free to call the clinic directly."
      );
    }

    const clean = sanitizeReply(parsed);
    return NextResponse.json({
      ...clean,
      signature: signReply(clean.reply, messages.length),
      signing_enabled: signingConfigured(),
    });
  } catch (error) {
    // Generic client-facing errors: upstream messages can echo prompt content
    // or provider internals, neither of which belongs in a browser response.
    // Logs carry the error type only — never the conversation.
    if (error instanceof RateLimitError) {
      // OpenAI returns 429 for two unrelated conditions: genuine
      // rate limiting, and `insufficient_quota` — an account with no credit
      // or billing configured. They need completely different fixes (wait
      // vs. top up the account), so log the code that distinguishes them.
      // It is an OpenAI error classification, never request content.
      console.error("Concierge upstream 429, code:", error.code ?? "unknown");
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    if (error instanceof APIError) {
      console.error(
        "Concierge upstream error, status:",
        error.status,
        "code:",
        error.code ?? "unknown"
      );
      return NextResponse.json({ error: "upstream" }, { status: 502 });
    }
    console.error("Concierge server error:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
