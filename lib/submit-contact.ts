/**
 * One entry point for every on-site form that delivers to the clinic inbox:
 * the contact form, the pre-visit intake, the /review private feedback box,
 * and the ICBC callback request.
 *
 * It hides the difference between the two deploy targets:
 *
 *   - **Node deploy** — POST to the `/api/contact` relay, which keeps the
 *     Web3Forms key server-side and adds origin + rate-limit checks.
 *   - **Static deploy** (SiteGround `public_html`) — there is no relay, so the
 *     browser posts to Web3Forms directly using NEXT_PUBLIC_WEB3FORMS_KEY. If
 *     that key isn't set, a synthetic 501 is returned and the caller's
 *     existing mailto: fallback takes over.
 *
 * The return value is always a real `Response` with the same status contract
 * the relay uses (501 / 429 / 400 / 200 `{success:true}`), so callers handle
 * one shape regardless of target.
 */

import { WEB3FORMS_ENDPOINT, buildWeb3FormsBody, validateContactPayload } from "@/lib/contact";
import { HAS_SERVER_API, apiUrl } from "@/lib/deploy-target";

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Posts a contact-style payload and resolves to a relay-shaped `Response`.
 * Network failures still reject, so callers keep their existing try/catch.
 */
export async function postContact(payload: Record<string, unknown>): Promise<Response> {
  if (HAS_SERVER_API) {
    return fetch(apiUrl("/api/contact"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  // Honeypot: bots fill hidden fields. Pretend success without forwarding —
  // same as the relay does.
  if (payload.botcheck) {
    return jsonResponse({ success: true }, 200);
  }

  // On a static build the key has to be readable by the browser, so only the
  // NEXT_PUBLIC_ variant can work here. Without it, signal "not configured"
  // and let the caller open the visitor's email app instead.
  const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_KEY;
  if (!accessKey) {
    return jsonResponse(
      { error: "Message relay isn't configured yet. Please email us directly." },
      501
    );
  }

  // Same validation the relay runs, so error messages match across targets.
  const validation = validateContactPayload(payload);
  if (!validation.ok) {
    return jsonResponse({ errors: validation.errors }, 400);
  }

  const res = await fetch(WEB3FORMS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(buildWeb3FormsBody(accessKey, validation.data)),
  });

  let json: { success?: boolean; message?: string } = {};
  try {
    json = await res.json();
  } catch {
    // Leave success undefined — treated as a failure below.
  }

  if (json.success) {
    return jsonResponse({ success: true }, 200);
  }

  return jsonResponse(
    { error: json.message || "Something went wrong. Please call the clinic." },
    502
  );
}
