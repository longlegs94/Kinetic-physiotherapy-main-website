/**
 * Request-level guards shared by the API routes: origin validation, client IP
 * derivation, and bounded JSON body reading.
 *
 * The origin check previously returned true whenever it was unsure — missing
 * header, unset NEXT_PUBLIC_SITE_URL, unparsable value — and always allowed
 * any localhost origin. In production that last rule alone defeated the check,
 * since `Origin: http://localhost` is trivially settable by a non-browser
 * client. Production now enforces an allowlist and denies by default; the
 * permissive behaviour is confined to development.
 */

export type RequestEnv = {
  NODE_ENV?: string;
  VERCEL_ENV?: string;
  VERCEL_URL?: string;
  NEXT_PUBLIC_SITE_URL?: string;
};

/** Production means "real traffic": a Vercel production deploy, or NODE_ENV=production. */
export function isProductionRuntime(env: RequestEnv = process.env): boolean {
  if (env.VERCEL_ENV) return env.VERCEL_ENV === "production";
  return env.NODE_ENV === "production";
}

function hostOf(value: string): string | null {
  try {
    // Bare hostnames (VERCEL_URL) have no scheme.
    const withScheme = value.includes("://") ? value : `https://${value}`;
    return new URL(withScheme).host.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Hosts permitted to call the state-changing routes. The canonical site plus,
 * on Vercel, the deploy's own hostname so preview deploys can exercise their
 * own forms.
 */
export function allowedOriginHosts(env: RequestEnv = process.env): string[] {
  const hosts = new Set<string>();

  const site = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) {
    const host = hostOf(site);
    if (host) hosts.add(host);
  }

  const vercelUrl = env.VERCEL_URL?.trim();
  if (vercelUrl) {
    const host = hostOf(vercelUrl);
    if (host) hosts.add(host);
  }

  return [...hosts];
}

/**
 * Same-origin check for state-changing API routes.
 *
 * Production: the Origin header is required and must be one of the allowed
 * hosts. A preview deploy additionally accepts its own *.vercel.app hostname,
 * because Vercel mints a fresh one per deployment that can't be enumerated in
 * advance. Anything else — including localhost — is denied.
 *
 * Development: permissive, so `curl` and local tooling keep working.
 */
export function isAllowedOrigin(
  originHeader: string | null,
  env: RequestEnv = process.env
): boolean {
  if (!isProductionRuntime(env)) return true;

  // A browser always sends Origin on cross-origin and same-origin POSTs, so a
  // missing header in production is not a browser form submission.
  if (!originHeader) return false;

  const originHost = hostOf(originHeader);
  if (!originHost) return false;

  const allowed = allowedOriginHosts(env);
  if (allowed.includes(originHost)) return true;

  if (env.VERCEL_ENV === "preview" && originHost.endsWith(".vercel.app")) return true;

  return false;
}

/**
 * Derives the client IP from standard proxy headers.
 *
 * On Vercel, x-forwarded-for is appended to by the platform, so the left-most
 * entry is client-controlled and spoofable. That is acceptable here — the
 * value only keys a rate-limit bucket, and spoofing it fragments an
 * attacker's own quota rather than escaping it. It must never be used for
 * authorization.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim().slice(0, 64);

  return "unknown";
}

export type BodyResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: "too_large" | "invalid_json" | "not_object" };

/** Default cap for JSON bodies. Comfortably above the largest legitimate form. */
export const MAX_BODY_BYTES = 32 * 1024;

/**
 * Reads a JSON object body with a hard size ceiling.
 *
 * `request.json()` buffers whatever arrives, so an unbounded body is a memory
 * amplification vector on a serverless function. The declared Content-Length
 * is checked first as a cheap rejection, then the actual bytes are counted
 * while streaming, because Content-Length can be absent or lie.
 */
export async function readJsonObject(
  request: Request,
  maxBytes: number = MAX_BODY_BYTES
): Promise<BodyResult<Record<string, unknown>>> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { ok: false, reason: "too_large" };
  }

  let text: string;
  try {
    const buffer = await request.arrayBuffer();
    if (buffer.byteLength > maxBytes) {
      return { ok: false, reason: "too_large" };
    }
    text = new TextDecoder().decode(buffer);
  } catch {
    return { ok: false, reason: "invalid_json" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: "invalid_json" };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, reason: "not_object" };
  }

  return { ok: true, value: parsed as Record<string, unknown> };
}
