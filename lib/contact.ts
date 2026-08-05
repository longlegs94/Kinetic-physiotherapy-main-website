/**
 * Shared constants and validation for the contact form, used by both the
 * client component (components/cards/ContactForm.tsx) and the server relay
 * (app/api/contact/route.node.ts) so the category list and validation rules stay
 * in sync in one place.
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return value.length > 0 && value.length <= 254 && EMAIL_RE.test(value);
}

// Digits, spaces, and common phone punctuation (+, -, (), ., x for extension).
const PHONE_RE = /^[0-9+\-() .xX]*$/;

export type ContactPayload = {
  name: string;
  email: string;
  phone: string;
  category: string;
  callbackTime: string;
  message: string;
  subject: string;
  formName: string;
};

export type ContactValidation =
  | { ok: true; data: ContactPayload }
  | { ok: false; errors: Record<string, string> };

/**
 * Validates a raw JSON body for the /api/contact relay. `formName`
 * distinguishes the public contact form ("contact", the default) from any
 * other caller that reuses this endpoint (e.g. "feedback", "icbc-callback",
 * "intake") but doesn't share the same fixed category list. For "contact",
 * category must be one of CONTACT_CATEGORIES; for everything else, category
 * is optional — when present it's just length-checked, when absent it's
 * skipped — so new forms can post here without enumerating each formName.
 */
export function validateContactPayload(record: Record<string, unknown>): ContactValidation {
  const errors: Record<string, string> = {};

  const formName =
    typeof record.formName === "string" && record.formName.trim()
      ? record.formName.trim().slice(0, 40)
      : "contact";

  // The public contact form requires a name and a valid email. Other callers
  // that reuse this relay (feedback, icbc-callback) collect different fields —
  // for them name and email are optional, and email is only format-checked
  // when the visitor actually provides one.
  const isContactForm = formName === "contact";

  const name = typeof record.name === "string" ? record.name.trim() : "";
  if (isContactForm && (name.length < 1 || name.length > 100)) {
    errors.name = "Please enter your name.";
  } else if (name.length > 100) {
    errors.name = "Name is too long.";
  }

  const email = typeof record.email === "string" ? record.email.trim() : "";
  if (isContactForm) {
    if (!isValidEmail(email)) {
      errors.email = "Please enter a valid email address.";
    }
  } else if (email && !isValidEmail(email)) {
    errors.email = "Please enter a valid email address.";
  }

  const phone = typeof record.phone === "string" ? record.phone.trim() : "";
  if (phone.length > 25) {
    errors.phone = "Phone number is too long.";
  } else if (phone && !PHONE_RE.test(phone)) {
    errors.phone = "Please enter a valid phone number.";
  }

  const category = typeof record.category === "string" ? record.category.trim() : "";
  if (formName === "contact") {
    if (!CONTACT_CATEGORIES.includes(category as ContactCategory)) {
      errors.category = "Please choose a valid category.";
    }
  } else if (category && category.length > 100) {
    errors.category = "Category is too long.";
  }

  const callbackTime =
    typeof record.callback_time === "string" ? record.callback_time.trim().slice(0, 100) : "";

  const message = typeof record.message === "string" ? record.message.trim() : "";
  if (message.length < 1 || message.length > 4000) {
    errors.message = "Message must be between 1 and 4000 characters.";
  }

  const subject = typeof record.subject === "string" ? record.subject.trim().slice(0, 200) : "";

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, data: { name, email, phone, category, callbackTime, message, subject, formName } };
}

/** Where Web3Forms submissions go, however they get there. */
export const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";

// Readable Web3Forms subject per formName so the clinic inbox shows at a
// glance which surface the message came from. Unlisted/future formNames
// (relaxed by validateContactPayload above) fall back to "Website enquiry".
const SUBJECT_PREFIXES: Record<string, string> = {
  contact: "Website enquiry",
  intake: "Pre-visit intake",
  feedback: "Website feedback",
  "icbc-callback": "ICBC callback request",
};

/**
 * Builds the exact JSON body Web3Forms expects. Shared so the two delivery
 * paths produce identical emails: the server relay
 * (app/api/contact/route.node.ts) on Node deploys, and the browser posting
 * straight to Web3Forms (lib/submit-contact.ts) on static SiteGround deploys.
 */
export function buildWeb3FormsBody(accessKey: string, data: ContactPayload) {
  const { name, email, phone, category, callbackTime, message, subject, formName } = data;
  const prefix = SUBJECT_PREFIXES[formName] || "Website enquiry";
  const finalSubject =
    subject ||
    (category
      ? `${prefix} (${category}) — Kinetic Therapy`
      : `${prefix} — Kinetic Therapy`);

  return {
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
  };
}
