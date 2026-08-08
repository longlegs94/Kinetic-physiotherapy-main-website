import OpenAI, { APIError, RateLimitError } from "openai";
import { NextResponse } from "next/server";

import {
  INTAKE_MODEL,
  INTAKE_SCHEMA,
  INTAKE_SCHEMA_NAME,
  buildIntakeSystemPrompt,
  type IntakeInput,
  type IntakeSummary,
} from "@/lib/intake";
import { checkRateLimit } from "@/lib/rate-limit";
import { detectRedFlagsIn, emergencyMessage } from "@/lib/red-flags";
import { getClientIp, isAllowedOrigin, readJsonObject } from "@/lib/request";
import { clinic, services } from "@/lib/site-data";

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
  return NextResponse.json({ enabled: Boolean(process.env.OPENAI_API_KEY) });
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ip = getClientIp(request);
  const [perMinute, perHour] = await Promise.all([
    checkRateLimit(`intake:min:${ip}`, { limit: 5, windowMs: 60_000 }),
    checkRateLimit(`intake:hr:${ip}`, { limit: 20, windowMs: 3_600_000 }),
  ]);
  const limited = !perMinute.allowed || !perHour.allowed;
  if (limited) {
    const retryAfterSeconds = Math.max(perMinute.retryAfterSeconds, perHour.retryAfterSeconds);
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const body = await readJsonObject(request);
  if (!body.ok) {
    const status = body.reason === "too_large" ? 413 : 400;
    return NextResponse.json({ error: "invalid_request" }, { status });
  }

  const intake = body.value.intake;

  if (!isValidIntake(intake)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  // Emergency screening runs before the model and its verdict is final. The
  // summary is replaced wholesale rather than annotated, so no booking
  // suggestion can appear alongside "go to emergency". Nothing about the
  // matched text is logged — see lib/red-flags.ts.
  const redFlags = detectRedFlagsIn(INTAKE_FIELDS.map((field) => intake[field]));
  if (redFlags.triggered) {
    return NextResponse.json({
      summary: emergencyMessage(redFlags.categories, clinic.phone),
      key_points: [],
      suggested_services: [],
      flags: redFlags.categories,
      emergency: true,
    });
  }

  const userMessage = buildUserMessage(intake);

  try {
    const response = await client.chat.completions.create({
      model: INTAKE_MODEL,
      max_completion_tokens: 1024,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: INTAKE_SCHEMA_NAME, schema: INTAKE_SCHEMA, strict: true },
      },
    });

    const message = response.choices[0]?.message;

    // Structured Outputs' refusal path: the model declines and explains why
    // in `refusal` instead of filling the schema. Equivalent to Anthropic's
    // stop_reason === "refusal" in the previous version of this route.
    if (message?.refusal) {
      return NextResponse.json(safeSummary());
    }

    const text = message?.content ?? "";

    try {
      const parsed = JSON.parse(text) as IntakeSummary;
      return NextResponse.json(sanitizeSummary(parsed));
    } catch {
      return NextResponse.json(safeSummary());
    }
  } catch (error) {
    // Generic client-facing errors, and logs that carry the error type only.
    // An upstream error body can quote the request that caused it, which for
    // this route is the patient's intake answers — never log it.
    if (error instanceof RateLimitError) {
      console.error("Intake upstream rate limited");
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    if (error instanceof APIError) {
      console.error("Intake upstream error, status:", error.status);
      return NextResponse.json({ error: "upstream" }, { status: 502 });
    }
    console.error("Intake server error:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
