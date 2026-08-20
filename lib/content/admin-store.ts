import { revalidatePath, revalidateTag } from "next/cache";

import type { ClinicInput, PractitionerInput } from "@/lib/admin/content-schema";

import { CONTENT_CACHE_TAG } from "./store";
import { readClient, writeClient } from "./supabase";

/**
 * Reads and writes the staff portal performs against Supabase.
 *
 * Separate from lib/content/store.ts on purpose. That module serves the public
 * site: cached, filtered to verified content, and always falling back to the
 * bundled copy so visitors never see an error. This one serves the editor and
 * needs the opposite of all three — uncached, unfiltered, and honest about
 * failure, because saving against stale data or silently doing nothing is
 * worse for an editor than an error message.
 *
 * Every write does three things in order: change the row, record who did it,
 * and invalidate the public cache. The last of those is what makes an edit
 * appear on the website within seconds instead of at the next deploy.
 */

export type AdminPractitioner = {
  id: string;
  sortOrder: number;
  name: string;
  title: string;
  category: string;
  bio: string;
  specialInterests: string[];
  languages: string[];
  icbcAccepted: boolean;
  schedule: string;
  bookingUrl: string;
  needsVerification: boolean;
};

export type AdminClinic = {
  name: string;
  positioning: string;
  city: string;
  province: string;
  country: string;
  address: string;
  phone: string;
  email: string;
  fax: string;
  janeBookingUrl: string;
  facebook: string;
  instagram: string;
  hours: { days: string; hours: string }[];
};

/** Anything the editor can act on. Messages are written for a receptionist. */
export class ContentStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContentStoreError";
  }
}

/**
 * Turns a Supabase failure into something worth showing someone.
 *
 * A connection failure surfaces as "TypeError: fetch failed", which tells a
 * receptionist nothing and tells them to do nothing. On the free tier the
 * overwhelmingly likely cause is the project having paused, so the message
 * says that and says what fixes it.
 */
function readable(action: string, message: string): ContentStoreError {
  const connectionFailure =
    /fetch failed|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|network|timeout/i.test(message);
  if (connectionFailure) {
    return new ContentStoreError(
      `Couldn't reach the database to ${action}. It may have gone to sleep — open the Supabase dashboard to wake it, then try again.`
    );
  }
  return new ContentStoreError(`Couldn't ${action}: ${message}`);
}

function requireWriteClient() {
  const client = writeClient();
  if (!client) {
    throw new ContentStoreError(
      "Saving isn't set up on this deployment — the database connection needs configuring."
    );
  }
  return client;
}

function requireReadClient() {
  const client = readClient();
  if (!client) {
    throw new ContentStoreError("The database isn't configured on this deployment.");
  }
  return client;
}

const str = (value: unknown): string => (typeof value === "string" ? value : "");

/* ------------------------------------------------------------------ *
 * Reads
 * ------------------------------------------------------------------ */

const PRACTITIONER_COLUMNS =
  "id, sort_order, name, title, category, bio, special_interests, languages, icbc_accepted, schedule, booking_url, needs_verification";

type Row = Record<string, unknown>;

function toAdminPractitioner(row: Row): AdminPractitioner {
  return {
    id: str(row.id),
    sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0,
    name: str(row.name),
    title: str(row.title),
    category: str(row.category),
    bio: str(row.bio),
    specialInterests: Array.isArray(row.special_interests) ? (row.special_interests as string[]) : [],
    languages: Array.isArray(row.languages) ? (row.languages as string[]) : [],
    icbcAccepted: row.icbc_accepted === true,
    schedule: str(row.schedule),
    bookingUrl: str(row.booking_url),
    needsVerification: row.needs_verification === true,
  };
}

/** Every therapist, unverified ones included — the portal has to show what it
 *  is editing, not what the public currently sees. */
export async function listPractitioners(): Promise<AdminPractitioner[]> {
  const { data, error } = await requireReadClient()
    .from("practitioners")
    .select(PRACTITIONER_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw readable("load the therapist list", error.message);
  return (data ?? []).map((row) => toAdminPractitioner(row as Row));
}

export async function getPractitioner(id: string): Promise<AdminPractitioner | null> {
  const { data, error } = await requireReadClient()
    .from("practitioners")
    .select(PRACTITIONER_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw readable("load that therapist", error.message);
  return data ? toAdminPractitioner(data as Row) : null;
}

export async function getClinicForEditing(): Promise<AdminClinic> {
  const { data, error } = await requireReadClient()
    .from("clinic_info")
    .select(
      "name, positioning, city, province, country, address, phone, email, fax, jane_booking_url, facebook, instagram, opening_hours"
    )
    .eq("id", 1)
    .maybeSingle();

  if (error) throw readable("load the clinic details", error.message);
  if (!data) throw new ContentStoreError("The clinic details row is missing from the database.");

  const row = data as Row;
  const hours = Array.isArray(row.opening_hours) ? (row.opening_hours as Row[]) : [];

  return {
    name: str(row.name),
    positioning: str(row.positioning),
    city: str(row.city),
    province: str(row.province),
    country: str(row.country),
    address: str(row.address),
    phone: str(row.phone),
    email: str(row.email),
    fax: str(row.fax),
    janeBookingUrl: str(row.jane_booking_url),
    facebook: str(row.facebook),
    instagram: str(row.instagram),
    hours: hours.map((h) => ({ days: str(h.days), hours: str(h.hours) })),
  };
}

/* ------------------------------------------------------------------ *
 * Writes
 * ------------------------------------------------------------------ */

/**
 * Records a change and refreshes the public site.
 *
 * A failed log entry must not fail the edit that already succeeded — the
 * content change is the thing the user asked for, and rolling it back because
 * the audit row didn't insert would be the wrong trade. It is logged loudly
 * instead.
 */
async function recordAndRevalidate(entry: {
  actorEmail: string;
  entity: "practitioner" | "clinic";
  entityId: string | null;
  action: "create" | "update" | "delete";
  summary: string;
  before: unknown;
  after: unknown;
}): Promise<void> {
  try {
    const { error } = await requireWriteClient().from("content_change_log").insert({
      actor_email: entry.actorEmail,
      entity: entry.entity,
      entity_id: entry.entityId,
      action: entry.action,
      summary: entry.summary,
      before: entry.before ?? null,
      after: entry.after ?? null,
    });
    if (error) throw new Error(error.message);
  } catch (error) {
    console.error(
      "Content change log write failed (the change itself was saved):",
      error instanceof Error ? error.message : "unknown error"
    );
  }

  // What turns a save into a visible change rather than something waiting for
  // the next deploy. Two steps are needed because two things are cached:
  //
  //  - the *data* read from Supabase, held by unstable_cache under this tag.
  //    `expire: 0` drops it now rather than serving it stale once more, which
  //    is the difference between "my change is live" and "my change appears on
  //    the second refresh".
  //  - the *rendered HTML* of every public page, which is prerendered. The
  //    pages all sit under the site layout that reads the clinic details, so
  //    invalidating the root layout covers them without having to enumerate
  //    which page shows which field.
  revalidateTag(CONTENT_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
}

function practitionerColumns(input: PractitionerInput) {
  return {
    name: input.name,
    title: input.title,
    category: input.category,
    bio: input.bio || null,
    special_interests: input.specialInterests,
    languages: input.languages,
    icbc_accepted: input.icbcAccepted,
    schedule: input.schedule || null,
    booking_url: input.bookingUrl || null,
  };
}

export async function createPractitioner(
  input: PractitionerInput,
  actorEmail: string
): Promise<AdminPractitioner> {
  const client = requireWriteClient();

  // New therapists go to the end of the public list.
  const { data: last } = await client
    .from("practitioners")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sortOrder = ((last as Row | null)?.sort_order as number | undefined ?? -1) + 1;

  const { data, error } = await client
    .from("practitioners")
    .insert({ ...practitionerColumns(input), sort_order: sortOrder })
    .select(PRACTITIONER_COLUMNS)
    .single();

  if (error) throw readable("add that therapist", error.message);

  const created = toAdminPractitioner(data as Row);
  await recordAndRevalidate({
    actorEmail,
    entity: "practitioner",
    entityId: created.id,
    action: "create",
    summary: `Added ${created.name} (${created.title})`,
    before: null,
    after: created,
  });
  return created;
}

export async function updatePractitioner(
  id: string,
  input: PractitionerInput,
  actorEmail: string
): Promise<AdminPractitioner> {
  const before = await getPractitioner(id);
  if (!before) {
    throw new ContentStoreError("That therapist no longer exists — reload and try again.");
  }

  const { data, error } = await requireWriteClient()
    .from("practitioners")
    // needs_verification is deliberately not writable from the form: whether a
    // credential has been confirmed is not a claim someone should be able to
    // make about themselves while editing their own bio.
    .update(practitionerColumns(input))
    .eq("id", id)
    .select(PRACTITIONER_COLUMNS)
    .single();

  if (error) throw readable("save that therapist", error.message);

  const after = toAdminPractitioner(data as Row);
  await recordAndRevalidate({
    actorEmail,
    entity: "practitioner",
    entityId: id,
    action: "update",
    summary: `Updated ${after.name}'s profile`,
    before,
    after,
  });
  return after;
}

export async function deletePractitioner(id: string, actorEmail: string): Promise<string> {
  const before = await getPractitioner(id);
  if (!before) {
    throw new ContentStoreError("That therapist no longer exists — reload and try again.");
  }

  const { error } = await requireWriteClient().from("practitioners").delete().eq("id", id);
  if (error) throw readable("remove that therapist", error.message);

  await recordAndRevalidate({
    actorEmail,
    entity: "practitioner",
    entityId: id,
    action: "delete",
    summary: `Removed ${before.name} from the team`,
    before,
    after: null,
  });
  return before.name;
}

export async function updateClinic(input: ClinicInput, actorEmail: string): Promise<void> {
  const before = await getClinicForEditing();

  // Hours keep whatever verification flag their row already carried, matched by
  // the days label, so re-saving the form doesn't quietly mark unconfirmed
  // hours as confirmed.
  const { data: current } = await requireReadClient()
    .from("clinic_info")
    .select("opening_hours")
    .eq("id", 1)
    .maybeSingle();
  const previousHours = Array.isArray((current as Row | null)?.opening_hours)
    ? ((current as Row).opening_hours as Row[])
    : [];

  const openingHours = input.hours.map((row) => {
    const match = previousHours.find((h) => h.days === row.days);
    return { days: row.days, hours: row.hours, needsVerification: match?.needsVerification === true };
  });

  const { error } = await requireWriteClient()
    .from("clinic_info")
    .update({
      name: input.name,
      positioning: input.positioning,
      city: input.city,
      province: input.province,
      country: input.country,
      address: input.address,
      phone: input.phone,
      email: input.email,
      fax: input.fax || null,
      jane_booking_url: input.janeBookingUrl,
      facebook: input.facebook || null,
      instagram: input.instagram || null,
      opening_hours: openingHours,
    })
    .eq("id", 1);

  if (error) throw readable("save the clinic details", error.message);

  await recordAndRevalidate({
    actorEmail,
    entity: "clinic",
    entityId: "1",
    action: "update",
    summary: "Updated clinic contact information",
    before,
    after: { ...input, hours: openingHours },
  });
}

/** The most recent content changes, for the portal's history view. */
export async function recentChanges(limit = 20) {
  const client = writeClient();
  // The log is service-role only by design; without that key there is nothing
  // to show, which is not an error worth interrupting the page for.
  if (!client) return [];

  const { data, error } = await client
    .from("content_change_log")
    .select("id, changed_at, actor_email, entity, action, summary")
    .order("changed_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Couldn't load the change log:", error.message);
    return [];
  }
  return (data ?? []).map((row) => {
    const r = row as Row;
    return {
      id: Number(r.id),
      changedAt: str(r.changed_at),
      actorEmail: str(r.actor_email),
      entity: str(r.entity),
      action: str(r.action),
      summary: str(r.summary),
    };
  });
}
