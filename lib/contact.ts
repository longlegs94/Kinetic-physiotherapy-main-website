/**
 * Shared constants and validation for every form that posts to the
 * /api/contact relay, used by both the client components and the server route
 * so rules stay in one place.
 *
 * Each surface declares an explicit schema below. The previous design had a
 * single relaxed rule — "contact" was strict, everything else optional — which
 * meant two things went wrong: an unknown `formName` was accepted and silently
 * treated as a loose form, and an ICBC callback request could be submitted
 * with neither a name nor a phone number, leaving the clinic with a lead they
 * had no way to call back. Both are now rejected.
 */

export const CONTACT_CATEGORIES = [
  "Booking",
  "Request a callback",
  "Inquiry",
  "ICBC",
  "WSBC",
  "Complaint",
  "Other",
] as const;

export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];

export const CALLBACK_TIMES = [
  "Anytime during clinic hours",
  "Morning (8am–12pm)",
  "Afternoon (12pm–5pm)",
  "Evening (5pm–8pm)",
] as const;

/** Every form permitted to use the relay. Anything else is rejected. */
export const FORM_NAMES = ["contact", "intake", "feedback", "icbc-callback"] as const;
export type FormName = (typeof FORM_NAMES)[number];

export function isFormName(value: unknown): value is FormName {
  return typeof value === "string" && (FORM_NAMES as readonly string[]).includes(value);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return value.length > 0 && value.length <= 254 && EMAIL_RE.test(value);
}

// Digits, spaces, and common phone punctuation (+, -, (), ., x for extension).
const PHONE_RE = /^[0-9+\-() .xX]*$/;

/**
 * A phone number is only useful if it can actually be dialled, so where phone
 * is required we also require enough digits to be a real number. North
 * American numbers are 10 digits; 11 with a country code. Accept 8+ so
 * international visitors aren't blocked, while still rejecting "n/a" or "123".
 */
function hasDiallableDigits(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

/**
 * True when a phone number is well-formed *and* actually dialable. Shared with
 * the client forms so they apply exactly the rule the server enforces.
 */
export function isCallablePhone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > FIELD_LIMITS.phone) return false;
  return PHONE_RE.test(trimmed) && hasDiallableDigits(trimmed);
}

type Requirement = "required" | "optional";
type CategoryRule = "enum" | "free" | "none";

type FormSchema = {
  name: Requirement;
  email: Requirement;
  phone: Requirement;
  category: CategoryRule;
  /** Fields this form is allowed to send beyond the common set. */
  extras: readonly ("callback_time" | "claim_number")[];
};

/**
 * Per-form rules. `required` fields must be present and well-formed;
 * `optional` fields are still format-checked when non-empty.
 */
export const FORM_SCHEMAS: Record<FormName, FormSchema> = {
  // Public contact form: the visitor chooses a category from a fixed list.
  contact: { name: "required", email: "required", phone: "optional", category: "enum", extras: [] },
  // Pre-visit intake: identifies the patient ahead of an appointment.
  intake: { name: "required", email: "required", phone: "optional", category: "free", extras: [] },
  // Private post-visit feedback: deliberately anonymous-friendly.
  feedback: { name: "optional", email: "optional", phone: "optional", category: "none", extras: [] },
  // ICBC callback: the clinic phones the patient back, so a name and a
  // reachable number are the whole point of the form.
  "icbc-callback": {
    name: "required",
    email: "optional",
    phone: "required",
    category: "free",
    extras: ["callback_time", "claim_number"],
  },
};

export const FIELD_LIMITS = {
  name: 100,
  email: 254,
  phone: 25,
  category: 100,
  subject: 200,
  message: 4000,
  callbackTime: 100,
  claimNumber: 60,
} as const;

export type ContactPayload = {
  name: string;
  email: string;
  phone: string;
  category: string;
  callbackTime: string;
  claimNumber: string;
  message: string;
  subject: string;
  formName: FormName;
};

export type ContactValidation =
  | { ok: true; data: ContactPayload }
  | { ok: false; errors: Record<string, string> };

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Validates a raw JSON body for the /api/contact relay against the schema for
 * its `formName`. An unrecognised or missing `formName` is an error rather
 * than a silent fallback, so a new client surface cannot start posting to the
 * clinic inbox without being declared here first.
 */
export function validateContactPayload(record: Record<string, unknown>): ContactValidation {
  const errors: Record<string, string> = {};

  if (!isFormName(record.formName)) {
    return { ok: false, errors: { formName: "Unrecognised form." } };
  }
  const formName: FormName = record.formName;
  const schema = FORM_SCHEMAS[formName];

  const name = readString(record.name);
  if (schema.name === "required" && name.length < 1) {
    errors.name = "Please enter your name.";
  } else if (name.length > FIELD_LIMITS.name) {
    errors.name = "Name is too long.";
  }

  const email = readString(record.email);
  if (schema.email === "required") {
    if (!isValidEmail(email)) errors.email = "Please enter a valid email address.";
  } else if (email && !isValidEmail(email)) {
    errors.email = "Please enter a valid email address.";
  }

  const phone = readString(record.phone);
  if (phone.length > FIELD_LIMITS.phone) {
    errors.phone = "Phone number is too long.";
  } else if (schema.phone === "required") {
    if (!phone) {
      errors.phone = "Please enter a phone number so we can call you back.";
    } else if (!PHONE_RE.test(phone) || !hasDiallableDigits(phone)) {
      errors.phone = "Please enter a valid phone number.";
    }
  } else if (phone && !PHONE_RE.test(phone)) {
    errors.phone = "Please enter a valid phone number.";
  }

  const category = readString(record.category);
  if (schema.category === "enum") {
    if (!CONTACT_CATEGORIES.includes(category as ContactCategory)) {
      errors.category = "Please choose a valid category.";
    }
  } else if (schema.category === "free" && category.length > FIELD_LIMITS.category) {
    errors.category = "Category is too long.";
  }

  const message = readString(record.message);
  if (message.length < 1 || message.length > FIELD_LIMITS.message) {
    errors.message = `Message must be between 1 and ${FIELD_LIMITS.message} characters.`;
  }

  // Extras are only accepted from forms that declare them, so a stray field
  // can't ride along into the clinic inbox from an unrelated surface.
  const allowsCallbackTime = schema.extras.includes("callback_time");
  const callbackTime = allowsCallbackTime
    ? readString(record.callback_time).slice(0, FIELD_LIMITS.callbackTime)
    : "";

  const allowsClaimNumber = schema.extras.includes("claim_number");
  const claimNumber = allowsClaimNumber
    ? readString(record.claim_number).slice(0, FIELD_LIMITS.claimNumber)
    : "";

  const subject = readString(record.subject).slice(0, FIELD_LIMITS.subject);

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: { name, email, phone, category, callbackTime, claimNumber, message, subject, formName },
  };
}
