import { isValidEmail } from "@/lib/contact";

/**
 * Validation and mutation for the parts of the content file the portal can
 * edit: the practitioner list and the clinic block.
 *
 * The important property here is that nothing downstream ever sees raw form
 * input. These validators return a closed set of typed fields, and the store
 * maps exactly those onto database columns, so a crafted post cannot reach a
 * column the form doesn't expose — `needs_verification` in particular, which
 * decides whether an unconfirmed credential is published.
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
