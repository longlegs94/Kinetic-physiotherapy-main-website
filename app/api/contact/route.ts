import { NextResponse } from "next/server";

import { validateContactPayload } from "@/lib/contact";
import { checkRateLimit, getClientIp, isAllowedOrigin } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-side relay for the public contact form and any other on-site form
 * that reuses it (the pre-visit intake form's final "send to clinic" step,
 * the /review page's private-feedback form, etc — see formName handling in
 * lib/contact.ts). Keeps the Web3Forms access key off the client, adds
 * origin/rate-limit checks, and validates the payload server-side before
 * forwarding.
 */
export async function POST(request: Request) {
  if (!isAllowedOrigin(request.headers.get("origin"), request.headers.get("referer"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ip = getClientIp(request);
  const perMinute = checkRateLimit(`contact:min:${ip}`, { limit: 5, windowMs: 60_000 });
  const perHour = checkRateLimit(`contact:hr:${ip}`, { limit: 20, windowMs: 3_600_000 });
  const limited = !perMinute.allowed || !perHour.allowed;
  if (limited) {
    const retryAfterSeconds = Math.max(perMinute.retryAfterSeconds, perHour.retryAfterSeconds);
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const record = body as Record<string, unknown>;

  // Honeypot: bots fill hidden fields. Pretend success without forwarding.
  if (record.botcheck) {
    return NextResponse.json({ success: true });
  }

  const validation = validateContactPayload(record);
  if (!validation.ok) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  // Prefer the server-only key; fall back to the legacy NEXT_PUBLIC_ one so
  // existing deployments that only set that keep working.
  const accessKey = process.env.WEB3FORMS_KEY || process.env.NEXT_PUBLIC_WEB3FORMS_KEY;
  if (!accessKey) {
    return NextResponse.json(
      { error: "Message relay isn't configured yet. Please email us directly." },
      { status: 501 }
    );
  }

  const { name, email, phone, category, callbackTime, message, subject, formName } = validation.data;
  // Readable Web3Forms subject per formName so the clinic inbox shows at a
  // glance which surface the message came from. Unlisted/future formNames
  // (relaxed via lib/contact.ts) fall back to "Website enquiry".
  const subjectPrefixes: Record<string, string> = {
    contact: "Website enquiry",
    intake: "Pre-visit intake",
    feedback: "Website feedback",
    "icbc-callback": "ICBC callback request",
  };
  const subjectPrefix = subjectPrefixes[formName] || "Website enquiry";
  const finalSubject =
    subject || (category
      ? `${subjectPrefix} (${category}) — Kinetic Therapy`
      : `${subjectPrefix} — Kinetic Therapy`);

  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: accessKey,
        subject: finalSubject,
        from_name: "Kinetic Therapy Website",
        name,
        email,
        phone: phone || undefined,
        category: category || undefined,
        formName,
        ...(callbackTime ? { callback_time: callbackTime } : {}),
        message,
      }),
    });

    let json: { success?: boolean; message?: string } = {};
    try {
      json = await res.json();
    } catch {
      // Fall through with success left undefined — treated as failure below.
    }

    if (json.success) {
      return NextResponse.json({ success: true });
    }

    console.error("Contact relay upstream error:", json.message || res.status);
    return NextResponse.json(
      { error: json.message || "Something went wrong. Please call the clinic." },
      { status: 502 }
    );
  } catch (error) {
    console.error("Contact relay network error:", error);
    return NextResponse.json(
      { error: "Network error. Please try again or call the clinic." },
      { status: 502 }
    );
  }
}
