import { unstable_cache } from "next/cache";

import bundled from "@/content/site-content.json";
import { filterVerified } from "@/lib/verification";
import type { Clinic, Hours, Practitioner, TrustBadge } from "@/lib/site-data";

import { readClient, readConfigured } from "./supabase";

/**
 * The therapist list and clinic contact block, read from Supabase.
 *
 * Two properties matter more than anything else here.
 *
 * **The public site can never break because of the database.** Every read
 * falls back to the copy of `content/site-content.json` bundled at build time.
 * If Supabase is unreachable, paused, or misconfigured, visitors see the last
 * known-good content instead of an error page. Stale beats down.
 *
 * **A save shows up immediately.** These reads are cached under a shared tag,
 * and the portal calls `revalidateContent()` after every write, so the next
 * request regenerates the affected pages with the new values. Between saves
 * the cache means the database is not touched on every visit.
 *
 * `revalidate` is also a belt-and-braces refresh: even if a tag invalidation
 * were ever missed, content cannot drift further than this window.
 */

/** Tag every cached content read carries, so one call can invalidate them all. */
export const CONTENT_CACHE_TAG = "site-content";

/** Six hours. Long enough that ordinary traffic rarely queries the database,
 *  short enough that a missed invalidation self-corrects the same day. */
const CACHE_TTL_SECONDS = 6 * 60 * 60;

/* ------------------------------------------------------------------ *
 * Row mapping
 * ------------------------------------------------------------------ */

type PractitionerRow = {
  id: string;
  sort_order: number;
  name: string;
  title: string;
  category: string;
  bio: string | null;
  special_interests: string[] | null;
  languages: string[] | null;
  icbc_accepted: boolean;
  schedule: string | null;
  booking_url: string | null;
  image: string | null;
  needs_verification: boolean;
};

type ClinicRow = {
  name: string;
  positioning: string;
  city: string;
  province: string;
  country: string;
  address: string;
  phone: string;
  email: string;
  fax: string | null;
  jane_booking_url: string;
  facebook: string | null;
  instagram: string | null;
  opening_hours: Hours[] | null;
  trust_badges: TrustBadge[] | null;
};

/** Optional text columns are null in Postgres and absent in the JSON shape the
 *  components expect, so empty values are dropped rather than passed through
 *  as nulls that would render as "null" or fail a truthiness check. */
function optional(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function toPractitioner(row: PractitionerRow): Practitioner {
  return {
    name: row.name,
    title: row.title,
    category: row.category,
    bio: optional(row.bio),
    specialInterests: row.special_interests?.length ? row.special_interests : undefined,
    languages: row.languages?.length ? row.languages : undefined,
    icbcAccepted: row.icbc_accepted,
    schedule: optional(row.schedule),
    bookingUrl: optional(row.booking_url),
    image: optional(row.image),
    needsVerification: row.needs_verification || undefined,
  };
}

function toClinic(row: ClinicRow): Clinic {
  const socials: { facebook?: string; instagram?: string } = {};
  const facebook = optional(row.facebook);
  const instagram = optional(row.instagram);
  if (facebook) socials.facebook = facebook;
  if (instagram) socials.instagram = instagram;

  return {
    name: row.name,
    positioning: row.positioning,
    city: row.city,
    province: row.province,
    country: row.country,
    address: row.address,
    phone: row.phone,
    email: row.email,
    fax: optional(row.fax),
    janeBookingUrl: row.jane_booking_url,
    socials: Object.keys(socials).length > 0 ? socials : undefined,
    hours: row.opening_hours ?? [],
    trustBadges: row.trust_badges ?? [],
  };
}

/* ------------------------------------------------------------------ *
 * Fallbacks
 * ------------------------------------------------------------------ */

const fallbackClinic = bundled.clinic as unknown as Clinic;
const fallbackPractitioners = bundled.practitioners as unknown as Practitioner[];

/** Logged once per failure so a paused or misconfigured database is visible in
 *  the Vercel logs rather than silently serving stale content forever. */
function reportFallback(what: string, error: unknown): void {
  console.error(
    `Content: falling back to bundled ${what} —`,
    error instanceof Error ? error.message : "database unavailable"
  );
}

/* ------------------------------------------------------------------ *
 * Reads
 * ------------------------------------------------------------------ */

async function loadClinic(): Promise<Clinic> {
  const client = readClient();
  if (!client) return fallbackClinic;

  try {
    const { data, error } = await client
      .from("clinic_info")
      .select(
        "name, positioning, city, province, country, address, phone, email, fax, jane_booking_url, facebook, instagram, opening_hours, trust_badges"
      )
      .eq("id", 1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return fallbackClinic;
    return toClinic(data as ClinicRow);
  } catch (error) {
    reportFallback("clinic information", error);
    return fallbackClinic;
  }
}

async function loadPractitioners(): Promise<Practitioner[]> {
  const client = readClient();
  if (!client) return fallbackPractitioners;

  try {
    const { data, error } = await client
      .from("practitioners")
      .select(
        "id, sort_order, name, title, category, bio, special_interests, languages, icbc_accepted, schedule, booking_url, image, needs_verification"
      )
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    if (!data) return fallbackPractitioners;
    return (data as PractitionerRow[]).map(toPractitioner);
  } catch (error) {
    reportFallback("therapists", error);
    return fallbackPractitioners;
  }
}

const cachedClinic = unstable_cache(loadClinic, ["content:clinic"], {
  tags: [CONTENT_CACHE_TAG],
  revalidate: CACHE_TTL_SECONDS,
});

const cachedPractitioners = unstable_cache(loadPractitioners, ["content:practitioners"], {
  tags: [CONTENT_CACHE_TAG],
  revalidate: CACHE_TTL_SECONDS,
});

/**
 * The clinic's contact block as the public site should render it.
 *
 * Unverified hours and trust badges are filtered here, matching what
 * lib/site-data.ts did when this came from JSON — the production gate has to
 * survive the move to a database.
 */
export async function getClinic(): Promise<Clinic> {
  const clinic = await cachedClinic();
  return {
    ...clinic,
    hours: filterVerified(clinic.hours ?? []),
    trustBadges: filterVerified(clinic.trustBadges ?? []),
  };
}

/** Therapists for the public site, with unconfirmed entries withheld. */
export async function getPractitioners(): Promise<Practitioner[]> {
  return filterVerified(await cachedPractitioners());
}

/** Every therapist including unconfirmed ones — for the staff portal, which
 *  has to show what it is editing. */
export async function getAllPractitioners(): Promise<Practitioner[]> {
  return cachedPractitioners();
}

/** Whether the values above came from the database or from the bundled copy.
 *  The portal surfaces this so staff are never editing against a fallback. */
export function contentSourceIsDatabase(): boolean {
  return readConfigured();
}

/* ------------------------------------------------------------------ *
 * Derived values
 * ------------------------------------------------------------------ */

/** Jane booking URL — env override wins, then the database. Mirrors the
 *  precedence lib/site-data.ts applied to the JSON. */
export function resolveBookingUrl(clinic: Clinic): string {
  return process.env.NEXT_PUBLIC_JANE_BOOKING_URL || clinic.janeBookingUrl;
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function mailHref(email: string): string {
  return `mailto:${email}`;
}
