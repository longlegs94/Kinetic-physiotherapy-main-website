import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { EnvProblem } from "../env";

/**
 * Supabase clients, and the rule about which one to use.
 *
 * Two keys, two jobs:
 *
 *  - The **anon key** reads. The two content tables are public information —
 *    the same therapist names and phone number already printed on the site —
 *    and row level security makes them read-only through this key. It is safe
 *    for it to be the one doing the work on every page render.
 *  - The **service role key** writes, and only ever from the staff portal's
 *    server actions. It bypasses row level security entirely, so it must never
 *    reach the browser. It is deliberately not NEXT_PUBLIC_ and nothing in a
 *    client component may import this module's `writeClient`.
 *
 * Both are optional. With neither configured the site falls back to the
 * content bundled at build time (see lib/content/store.ts) and the portal
 * reports itself read-only, so a missing key degrades the site rather than
 * breaking it.
 */

export type SupabaseEnv = {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  [key: string]: string | undefined;
};

function url(env: SupabaseEnv): string | null {
  const value = env.SUPABASE_URL?.trim().replace(/\/$/, "");
  return value || null;
}

/** Whether the site can read content from the database. */
export function readConfigured(env: SupabaseEnv = process.env): boolean {
  return Boolean(url(env) && env.SUPABASE_ANON_KEY?.trim());
}

/** Whether the portal can save. Requires the service role key on top of the
 *  read configuration, so a deployment can be given read-only access. */
export function writeConfigured(env: SupabaseEnv = process.env): boolean {
  return readConfigured(env) && Boolean(env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

/**
 * Client options shared by both roles.
 *
 * There is no browser here and no user sessions: every call is server-side and
 * acts as one of the two fixed roles. Turning session persistence and token
 * refresh off keeps the client from trying to manage auth state it will never
 * have, which in a serverless function is pure overhead.
 */
const CLIENT_OPTIONS = {
  auth: { persistSession: false, autoRefreshToken: false },
} as const;

export function readClient(env: SupabaseEnv = process.env): SupabaseClient | null {
  const base = url(env);
  const key = env.SUPABASE_ANON_KEY?.trim();
  if (!base || !key) return null;
  return createClient(base, key, CLIENT_OPTIONS);
}

/**
 * The writing client. Server-only: importing this into a client component
 * would ship a key that bypasses every access rule in the database.
 */
export function writeClient(env: SupabaseEnv = process.env): SupabaseClient | null {
  const base = url(env);
  const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!base || !key) return null;
  return createClient(base, key, CLIENT_OPTIONS);
}

/**
 * Configuration problems worth failing a production build over.
 *
 * Running with no database at all is a valid state — the site serves the
 * content bundled at build time. A *partial* configuration is not: a URL with
 * no key, or a service role key with nothing to point it at, produces a portal
 * whose Save buttons look live and fail on click.
 */
export function collectSupabaseEnvProblems(env: SupabaseEnv = process.env): EnvProblem[] {
  const problems: EnvProblem[] = [];
  const base = env.SUPABASE_URL?.trim();
  const anon = env.SUPABASE_ANON_KEY?.trim();
  const service = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!base && !anon && !service) return problems;

  if (base) {
    try {
      const parsed = new URL(base);
      if (parsed.protocol !== "https:") {
        problems.push({ variable: "SUPABASE_URL", problem: "must use https://" });
      }
    } catch {
      problems.push({
        variable: "SUPABASE_URL",
        problem: "is not a valid URL — it looks like https://<project-ref>.supabase.co",
      });
    }
  } else {
    problems.push({
      variable: "SUPABASE_URL",
      problem: "is required whenever any other SUPABASE_* variable is set",
    });
  }

  if (!anon) {
    problems.push({
      variable: "SUPABASE_ANON_KEY",
      problem: "is required for the site to read content from the database",
    });
  }

  // A service role key is optional (a read-only deployment is legitimate), but
  // one that is present and obviously wrong is worth catching at build time.
  if (service && service === anon) {
    problems.push({
      variable: "SUPABASE_SERVICE_ROLE_KEY",
      problem: "is the same value as SUPABASE_ANON_KEY — the anon key cannot write",
    });
  }

  return problems;
}
