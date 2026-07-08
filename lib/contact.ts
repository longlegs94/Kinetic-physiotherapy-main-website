/**
 * Shared constants and validation for the contact form, used by both the
 * client component (components/cards/ContactForm.tsx) and the server relay
 * (app/api/contact/route.ts) so the category list and validation rules stay
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
 * distinguishes the public contact form ("contact", the default) from
 * other callers (e.g. "intake") that reuse this endpoint but don't use the
 * same fixed category list — for those, category is just length-checked.
 */
export function validateContactPayload(record: Record<string, unknown>): ContactValidation {
  const errors: Record<string, string> = {};

  const formName =
    typeof record.formName === "string" && record.formName.trim()
      ? record.formName.trim().slice(0, 40)
      : "contact";

  const name = typeof record.name === "string" ? record.name.trim() : "";
  if (name.length < 1 || name.length > 100) {
    errors.name = "Please enter your name.";
  }

  const email = typeof record.email === "string" ? record.email.trim() : "";
  if (!isValidEmail(email)) {
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
  } else if (category.length < 1 || category.length > 100) {
    errors.category = "Please choose a category.";
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
