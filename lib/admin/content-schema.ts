import { isValidEmail } from "@/lib/contact";

/**
 * Validation and mutation for the parts of the content file the portal can
 * edit: the practitioner list and the clinic block.
 *
 * The important property here is that the portal never writes JSON a user
 * supplied. It loads the current file, applies one of the narrow mutations
 * below to a parsed copy, and writes the result. Each mutation rebuilds the
 * affected object field by field from a fixed list, so a crafted form post
 * cannot introduce new keys, replace unrelated sections, or smuggle a value of
 * the wrong type into content that pages render and that JSON-LD publishes to
 * Google. The blast radius of the whole write path is "the fields on the form".
 *
 * Validation follows the lib/contact.ts idiom — plain functions returning a
 * list of human-readable errors, so the same rules can be unit tested without
 * a request.
 */

/** Bounds chosen to fit the content, not to police it: long enough for the
 *  longest real bio on the site, short enough that a paste accident or an
 *  abusive payload can't bloat the file. */
const LIMITS = {
  name: 120,
  title: 200,
  category: 80,
  bio: 4000,
  schedule: 200,
  url: 500,
  address: 300,
  phone: 40,
  shortText: 300,
  listItem: 120,
  listLength: 30,
} as const;

export type FieldError = { field: string; message: string };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Collapses the whitespace a paste from Word or a website tends to carry —
 *  non-breaking spaces and stray runs — without touching paragraph breaks. */
function tidy(value: string): string {
  return value.replace(/ /g, " ").replace(/[ \t]+/g, " ").replace(/\r\n?/g, "\n").trim();
}

function requireText(
  value: unknown,
  field: string,
  label: string,
  max: number,
  errors: FieldError[]
): string {
  const cleaned = tidy(text(value));
  if (!cleaned) {
    errors.push({ field, message: `${label} is required.` });
  } else if (cleaned.length > max) {
    errors.push({ field, message: `${label} must be ${max} characters or fewer.` });
  }
  return cleaned;
}

function optionalText(value: unknown, field: string, label: string, max: number, errors: FieldError[]): string {
  const cleaned = tidy(text(value));
  if (cleaned.length > max) {
    errors.push({ field, message: `${label} must be ${max} characters or fewer.` });
  }
  return cleaned;
}

/**
 * Validates a URL the site will render as a link. Only https is accepted:
 * these values end up in hrefs and in the LocalBusiness schema, and an
 * http:// or javascript: value there is a downgrade or an injection.
 */
function optionalHttpsUrl(value: unknown, field: string, label: string, errors: FieldError[]): string {
  const cleaned = text(value);
  if (!cleaned) return "";
  if (cleaned.length > LIMITS.url) {
    errors.push({ field, message: `${label} must be ${LIMITS.url} characters or fewer.` });
    return cleaned;
  }
  let parsed: URL;
  try {
    parsed = new URL(cleaned);
  } catch {
    errors.push({ field, message: `${label} must be a full web address starting with https://` });
    return cleaned;
  }
  if (parsed.protocol !== "https:") {
    errors.push({ field, message: `${label} must start with https://` });
  }
  return cleaned;
}

/** Splits a textarea into a trimmed list, dropping blank lines. */
function lines(value: unknown, field: string, label: string, errors: FieldError[]): string[] {
  const items = text(value)
    .split("\n")
    .map((line) => tidy(line))
    .filter(Boolean);

  if (items.length > LIMITS.listLength) {
    errors.push({ field, message: `${label} can have at most ${LIMITS.listLength} entries.` });
  }
  if (items.some((item) => item.length > LIMITS.listItem)) {
    errors.push({ field, message: `Each ${label.toLowerCase()} entry must be ${LIMITS.listItem} characters or fewer.` });
  }
  return items.slice(0, LIMITS.listLength);
}

function checkbox(value: unknown): boolean {
  // A checked HTML checkbox posts "on"; an unchecked one posts nothing.
  return value === "on" || value === "true" || value === true;
}

/* ------------------------------------------------------------------ *
 * Practitioners
 * ------------------------------------------------------------------ */

export type PractitionerInput = {
  name: string;
  title: string;
  category: string;
  bio: string;
  specialInterests: string[];
  languages: string[];
  icbcAccepted: boolean;
  schedule: string;
  bookingUrl: string;
};

export type Validated<T> = { ok: true; value: T } | { ok: false; errors: FieldError[] };

export function validatePractitioner(form: {
  get(name: string): unknown;
}): Validated<PractitionerInput> {
  const errors: FieldError[] = [];

  const value: PractitionerInput = {
    name: requireText(form.get("name"), "name", "Name", LIMITS.name, errors),
    // Titles are regulated claims in BC ("Registered Massage Therapist"), so
    // this is required rather than optional — a practitioner card without one
    // is more misleading than no card.
    title: requireText(form.get("title"), "title", "Title", LIMITS.title, errors),
    category: requireText(form.get("category"), "category", "Category", LIMITS.category, errors),
    bio: optionalText(form.get("bio"), "bio", "Bio", LIMITS.bio, errors),
    specialInterests: lines(form.get("specialInterests"), "specialInterests", "Special interests", errors),
    languages: lines(form.get("languages"), "languages", "Languages", errors),
    icbcAccepted: checkbox(form.get("icbcAccepted")),
    schedule: optionalText(form.get("schedule"), "schedule", "Schedule", LIMITS.schedule, errors),
    bookingUrl: optionalHttpsUrl(form.get("bookingUrl"), "bookingUrl", "Booking link", errors),
  };

  return errors.length > 0 ? { ok: false, errors } : { ok: true, value };
}

/**
 * Builds the practitioner object as it is stored.
 *
 * Optional fields are omitted rather than written as empty strings, so the
 * file keeps the shape it has today and components can keep using presence
 * checks. `needsVerification` is carried over from the existing entry rather
 * than taken from the form: whether a credential has been confirmed is not a
 * claim the portal should let someone make about themselves in passing.
 */
function buildPractitioner(
  input: PractitionerInput,
  previous?: Record<string, unknown>
): Record<string, unknown> {
  const record: Record<string, unknown> = {
    name: input.name,
    title: input.title,
    category: input.category,
  };
  if (input.bio) record.bio = input.bio;
  if (input.specialInterests.length > 0) record.specialInterests = input.specialInterests;
  if (input.languages.length > 0) record.languages = input.languages;
  record.icbcAccepted = input.icbcAccepted;
  if (input.schedule) record.schedule = input.schedule;
  if (input.bookingUrl) record.bookingUrl = input.bookingUrl;

  // Preserve fields the portal doesn't expose, so editing a bio can't silently
  // drop a photo set elsewhere.
  if (previous && typeof previous.image === "string") record.image = previous.image;
  if (previous && previous.needsVerification === true) record.needsVerification = true;

  return record;
}

type ContentShape = Record<string, unknown> & {
  practitioners?: unknown;
  clinic?: unknown;
};

function practitionerList(content: unknown): Record<string, unknown>[] {
  const list = (content as ContentShape)?.practitioners;
  if (!Array.isArray(list)) {
    throw new Error("The content file has no practitioners list.");
  }
  return list as Record<string, unknown>[];
}

/** Reads a practitioner for editing. Index-based because the file has no ids
 *  and names are not guaranteed unique. */
export function getPractitioner(content: unknown, index: number): Record<string, unknown> | null {
  const list = practitionerList(content);
  return list[index] ?? null;
}

export function listPractitioners(content: unknown): Record<string, unknown>[] {
  return practitionerList(content);
}

export function upsertPractitioner(
  content: unknown,
  index: number | null,
  input: PractitionerInput
): unknown {
  const list = practitionerList(content);
  const next = [...list];

  if (index === null) {
    next.push(buildPractitioner(input));
  } else {
    const previous = next[index];
    if (!previous) throw new Error("That therapist no longer exists — reload and try again.");
    next[index] = buildPractitioner(input, previous);
  }

  return { ...(content as ContentShape), practitioners: next };
}

export function removePractitioner(content: unknown, index: number): unknown {
  const list = practitionerList(content);
  if (!list[index]) throw new Error("That therapist no longer exists — reload and try again.");
  return { ...(content as ContentShape), practitioners: list.filter((_, i) => i !== index) };
}

/* ------------------------------------------------------------------ *
 * Clinic block
 * ------------------------------------------------------------------ */

export type HoursInput = { days: string; hours: string };

export type ClinicInput = {
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
  hours: HoursInput[];
};

/** Digits plus the punctuation a printed phone number uses. Mirrors the rule
 *  the contact form applies, so the two can't disagree about what dials. */
function validatePhone(value: unknown, field: string, label: string, errors: FieldError[]): string {
  const cleaned = tidy(text(value));
  if (!cleaned) {
    errors.push({ field, message: `${label} is required.` });
    return cleaned;
  }
  if (cleaned.length > LIMITS.phone) {
    errors.push({ field, message: `${label} must be ${LIMITS.phone} characters or fewer.` });
    return cleaned;
  }
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) {
    errors.push({ field, message: `${label} doesn't look like a complete phone number.` });
  }
  return cleaned;
}

export function validateClinic(form: { get(name: string): unknown; getAll(name: string): unknown[] }): Validated<ClinicInput> {
  const errors: FieldError[] = [];

  const email = requireText(form.get("email"), "email", "Email", 254, errors);
  if (email && !isValidEmail(email)) {
    errors.push({ field: "email", message: "Email doesn't look like a valid address." });
  }

  const fax = tidy(text(form.get("fax")));
  if (fax) {
    const digits = fax.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) {
      errors.push({ field: "fax", message: "Fax number doesn't look like a complete number." });
    }
  }

  // Hours arrive as parallel arrays from a repeating fieldset. A row counts
  // only when it has both halves; a half-filled row would render as a blank
  // line in the footer and in Google's opening-hours data.
  const dayValues = form.getAll("hoursDays").map((v) => tidy(text(v)));
  const hourValues = form.getAll("hoursValue").map((v) => tidy(text(v)));
  const hours: HoursInput[] = [];
  for (let i = 0; i < Math.max(dayValues.length, hourValues.length); i += 1) {
    const days = dayValues[i] ?? "";
    const value = hourValues[i] ?? "";
    if (!days && !value) continue;
    if (!days || !value) {
      errors.push({ field: `hours.${i}`, message: `Row ${i + 1} of the hours needs both the days and the times.` });
      continue;
    }
    if (days.length > LIMITS.listItem || value.length > LIMITS.listItem) {
      errors.push({ field: `hours.${i}`, message: `Row ${i + 1} of the hours is too long.` });
      continue;
    }
    hours.push({ days, hours: value });
  }
  if (hours.length === 0) {
    errors.push({ field: "hours", message: "Add at least one row of opening hours." });
  }

  const value: ClinicInput = {
    name: requireText(form.get("name"), "name", "Clinic name", LIMITS.name, errors),
    positioning: optionalText(form.get("positioning"), "positioning", "Tagline", LIMITS.shortText, errors),
    city: requireText(form.get("city"), "city", "City", LIMITS.category, errors),
    province: requireText(form.get("province"), "province", "Province", LIMITS.category, errors),
    country: requireText(form.get("country"), "country", "Country", LIMITS.category, errors),
    address: requireText(form.get("address"), "address", "Address", LIMITS.address, errors),
    phone: validatePhone(form.get("phone"), "phone", "Phone", errors),
    email,
    fax,
    janeBookingUrl: optionalHttpsUrl(form.get("janeBookingUrl"), "janeBookingUrl", "Booking link", errors),
    facebook: optionalHttpsUrl(form.get("facebook"), "facebook", "Facebook link", errors),
    instagram: optionalHttpsUrl(form.get("instagram"), "instagram", "Instagram link", errors),
    hours,
  };

  if (!value.janeBookingUrl) {
    // Every "Book Now" button on the site points here; an empty value would
    // turn all of them into dead links.
    errors.push({ field: "janeBookingUrl", message: "Booking link is required." });
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true, value };
}

export function applyClinic(content: unknown, input: ClinicInput): unknown {
  const previous = (content as ContentShape)?.clinic;
  if (!previous || typeof previous !== "object") {
    throw new Error("The content file has no clinic block.");
  }
  const prev = previous as Record<string, unknown>;

  const clinic: Record<string, unknown> = {
    name: input.name,
    positioning: input.positioning,
    city: input.city,
    province: input.province,
    country: input.country,
    address: input.address,
    phone: input.phone,
    email: input.email,
  };
  if (input.fax) clinic.fax = input.fax;
  clinic.janeBookingUrl = input.janeBookingUrl;

  const socials: Record<string, string> = {};
  if (input.facebook) socials.facebook = input.facebook;
  if (input.instagram) socials.instagram = input.instagram;
  if (Object.keys(socials).length > 0) clinic.socials = socials;

  // Hours keep whatever verification flag their row already carried, matched
  // by the days label, so re-saving the form doesn't quietly mark unconfirmed
  // hours as confirmed.
  const previousHours = Array.isArray(prev.hours) ? (prev.hours as Record<string, unknown>[]) : [];
  clinic.hours = input.hours.map((row) => {
    const match = previousHours.find((h) => h.days === row.days);
    return match?.needsVerification === true
      ? { days: row.days, hours: row.hours, needsVerification: true }
      : { days: row.days, hours: row.hours, needsVerification: false };
  });

  // Trust badges are not on this form; carry them through untouched.
  if (prev.trustBadges !== undefined) clinic.trustBadges = prev.trustBadges;

  return { ...(content as ContentShape), clinic };
}

export function getClinic(content: unknown): Record<string, unknown> {
  const clinic = (content as ContentShape)?.clinic;
  if (!clinic || typeof clinic !== "object") {
    throw new Error("The content file has no clinic block.");
  }
  return clinic as Record<string, unknown>;
}
