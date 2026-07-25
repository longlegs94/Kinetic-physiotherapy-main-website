import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

import {
  CONCIERGE_MODEL,
  CONCIERGE_SCHEMA,
  buildSystemPrompt,
  type ConciergeReply,
} from "@/lib/concierge";
import { checkRateLimit, getClientIp, isAllowedOrigin } from "@/lib/rate-limit";
import { clinic, services } from "@/lib/site-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Module scope: constructed once per server instance, and reused across
// requests. Reads ANTHROPIC_API_KEY from the environment.
const client = new Anthropic();

// Module scope so the system prompt text is byte-stable across requests,
// which lets Anthropic's prompt caching reuse the cached prefix.
const SYSTEM_PROMPT = buildSystemPrompt();

const VALID_SLUGS = new Set(services.map((s) => s.slug));

type IncomingMessage = { role: "user" | "assistant"; content: string };

function isValidMessages(value: unknown): value is IncomingMessage[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20) {
    return false;
  }

  for (const item of value) {
    if (typeof item !== "object" || item === null) return false;
    const { role, content } = item as Record<string, unknown>;
    if (role !== "user" && role !== "assistant") return false;
    if (typeof content !== "string") return false;
    if (content.length === 0 || content.length > 2000) return false;
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

export async function GET() {
  return NextResponse.json({ enabled: Boolean(process.env.ANTHROPIC_API_KEY) });
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request.headers.get("origin"), request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ip = getClientIp(request);
  const perMinute = checkRateLimit(`concierge:min:${ip}`, { limit: 10, windowMs: 60_000 });
  const perHour = checkRateLimit(`concierge:hr:${ip}`, { limit: 60, windowMs: 3_600_000 });
  const limited = !perMinute.allowed || !perHour.allowed;
  if (limited) {
    const retryAfterSeconds = Math.max(perMinute.retryAfterSeconds, perHour.retryAfterSeconds);
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const messages =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>).messages
      : undefined;

  if (!isValidMessages(messages)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  // Defense in depth: the Anthropic API requires the first message to be
  // role "user" — drop any leading assistant messages (e.g. a client-side
  // greeting) rather than erroring.
  const firstUserIndex = messages.findIndex((m) => m.role === "user");
  const history = messages.slice(firstUserIndex);

  try {
    const response = await client.messages.create({
      model: CONCIERGE_MODEL,
      max_tokens: 1024,
      system: [
        { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      ],
      messages: history,
      output_config: { format: { type: "json_schema", schema: CONCIERGE_SCHEMA } },
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({
        reply: `I can't help with that here — please call the clinic at ${clinic.phone}.`,
        services: [],
        show_booking: false,
        show_contact: true,
      });
    }

    const textBlock = response.content.find(
      (block): block is Extract<(typeof response.content)[number], { type: "text" }> =>
        block.type === "text"
    );
    const text = textBlock?.text ?? "";

    try {
      const parsed = JSON.parse(text) as ConciergeReply;
      return NextResponse.json(sanitizeReply(parsed));
    } catch {
      return NextResponse.json({
        reply:
          "Sorry, I had trouble putting that together. Please try again, or feel free to call the clinic directly.",
        services: [],
        show_booking: false,
        show_contact: true,
      });
    }
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      console.error("Concierge rate limited:", error);
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    if (error instanceof Anthropic.APIError) {
      console.error("Concierge upstream error:", error);
      return NextResponse.json({ error: "upstream" }, { status: 502 });
    }
    console.error("Concierge server error:", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
