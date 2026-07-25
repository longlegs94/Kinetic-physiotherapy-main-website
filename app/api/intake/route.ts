import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

import {
  INTAKE_MODEL,
  INTAKE_SCHEMA,
  buildIntakeSystemPrompt,
  type IntakeInput,
  type IntakeSummary,
} from "@/lib/intake";
import { checkRateLimit, getClientIp, isAllowedOrigin } from "@/lib/rate-limit";
import { services } from "@/lib/site-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Module scope: constructed once per server instance, and reused across
// requests. Reads ANTHROPIC_API_KEY from the environment.
const client = new Anthropic();

// Module scope so the system prompt text is byte-stable across requests,
// which lets Anthropic's prompt caching reuse the cached prefix.
const SYSTEM_PROMPT = buildIntakeSystemPrompt();

const VALID_SLUGS = new Set(services.map((s) => s.slug));

const INTAKE_FIELDS = [
  "category",
  "concern",
  "onset",
  "modifiers",
  "painLevel",
  "goals",
  "icbcClaim",
] as const;

const MAX_FIELD_LENGTH = 1200;
const MAX_TOTAL_LENGTH = 5000;

function isValidIntake(value: unknown): value is IntakeInput {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;

  const category = record.category;
  const concern = record.concern;
  if (typeof category !== "string" || category.trim().length === 0) return false;
  if (typeof concern !== "string" || concern.trim().length === 0) return false;

  let totalLength = 0;
  for (const field of INTAKE_FIELDS) {
    const fieldValue = record[field];
    if (fieldValue === undefined) continue;
    if (typeof fieldValue !== "string") return false;
    if (fieldValue.length > MAX_FIELD_LENGTH) return false;
    totalLength += fieldValue.length;
  }

  if (totalLength > MAX_TOTAL_LENGTH) return false;

  return true;
}

function buildUserMessage(intake: IntakeInput): string {
  const lines: string[] = [];

  if (intake.category) lines.push(`Reason for visit: ${intake.category}`);
  if (intake.concern) lines.push(`Main concern: ${intake.concern}`);
  if (intake.onset) lines.push(`Started: ${intake.onset}`);
  if (intake.modifiers) lines.push(`Better/worse with: ${intake.modifiers}`);
  if (intake.painLevel) lines.push(`Pain level (0-10): ${intake.painLevel}`);
  if (intake.goals) lines.push(`Goals: ${intake.goals}`);
  if (intake.icbcClaim) lines.push(`ICBC claim: ${intake.icbcClaim}`);

  return lines.join("\n");
}

function safeSummary(): IntakeSummary {
  return {
    summary: "Summary unavailable — please review the patient's raw answers below.",
    key_points: [],
    suggested_services: [],
    flags: [],
  };
}

function sanitizeSummary(parsed: IntakeSummary): IntakeSummary {
  const seen = new Set<string>();
  const cleanServices: { name: string; slug: string }[] = [];

  for (const service of parsed.suggested_services ?? []) {
    if (!service || typeof service.slug !== "string") continue;
    if (!VALID_SLUGS.has(service.slug)) continue;
    if (seen.has(service.slug)) continue;
    seen.add(service.slug);
    cleanServices.push({ name: service.name, slug: service.slug });
    if (cleanServices.length >= 2) break;
  }

  const keyPoints = Array.isArray(parsed.key_points)
    ? parsed.key_points.filter((p): p is string => typeof p === "string").slice(0, 6)
    : [];

  const flags = Array.isArray(parsed.flags)
    ? parsed.flags.filter((f): f is string => typeof f === "string").slice(0, 5)
    : [];

  return {
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    key_points: keyPoints,
    suggested_services: cleanServices,
    flags,
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
  const perMinute = checkRateLimit(`intake:min:${ip}`, { limit: 5, windowMs: 60_000 });
  const perHour = checkRateLimit(`intake:hr:${ip}`, { limit: 20, windowMs: 3_600_000 });
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

  const intake =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>).intake
      : undefined;

  if (!isValidIntake(intake)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const userMessage = buildUserMessage(intake);

  try {
    const response = await client.messages.create({
      model: INTAKE_MODEL,
      max_tokens: 1024,
      system: [
        { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: userMessage }],
      output_config: { format: { type: "json_schema", schema: INTAKE_SCHEMA } },
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json(safeSummary());
    }

    const textBlock = response.content.find(
      (block): block is Extract<(typeof response.content)[number], { type: "text" }> =>
        block.type === "text"
    );
    const text = textBlock?.text ?? "";

    try {
      const parsed = JSON.parse(text) as IntakeSummary;
      return NextResponse.json(sanitizeSummary(parsed));
    } catch {
      return NextResponse.json(safeSummary());
    }
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      console.error("Intake rate limited:", error);
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    if (error instanceof Anthropic.APIError) {
      console.error("Intake upstream error:", error);
      return NextResponse.json({ error: "upstream" }, { status: 502 });
    }
    console.error("Intake server error:", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
