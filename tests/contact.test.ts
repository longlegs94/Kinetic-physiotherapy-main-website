import { describe, expect, it } from "vitest";

import { FORM_NAMES, isCallablePhone, validateContactPayload } from "@/lib/contact";

/** Minimal valid body for a given form, before per-case overrides. */
function body(overrides: Record<string, unknown> = {}) {
  return { formName: "contact", name: "Jo Patel", email: "jo@example.com", category: "Booking", message: "Hello", ...overrides };
}

describe("formName gating", () => {
  it("accepts every declared form", () => {
    for (const formName of FORM_NAMES) {
      const result = validateContactPayload(
        body({ formName, name: "Jo Patel", phone: "604-555-0132", category: "Booking" })
      );
      expect(result.ok, `${formName} should validate`).toBe(true);
    }
  });

  it.each([
    ["unknown surface", "newsletter"],
    ["empty string", ""],
    ["case variant", "Contact"],
    ["whitespace padded", " contact "],
    ["missing", undefined],
    ["non-string", 42],
  ])("rejects %s", (_label, formName) => {
    const result = validateContactPayload(body({ formName }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.formName).toBeDefined();
  });

  it("does not fall back to the contact schema for an unknown form", () => {
    // The regression this guards: an unknown formName used to be coerced to a
    // loose schema and relayed to the clinic inbox.
    const result = validateContactPayload({ formName: "anything", message: "spam" });
    expect(result.ok).toBe(false);
  });
});

describe("contact form", () => {
  it("requires a name", () => {
    const result = validateContactPayload(body({ name: "  " }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.name).toBeDefined();
  });

  it("requires a valid email", () => {
    const result = validateContactPayload(body({ email: "not-an-email" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.email).toBeDefined();
  });

  it("requires a category from the fixed list", () => {
    const result = validateContactPayload(body({ category: "Anything else" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.category).toBeDefined();
  });
});

describe("icbc-callback form", () => {
  const icbc = (overrides: Record<string, unknown> = {}) =>
    validateContactPayload({
      formName: "icbc-callback",
      name: "Jo Patel",
      phone: "604-555-0132",
      message: "Please call me back",
      ...overrides,
    });

  it("accepts a complete request", () => {
    expect(icbc().ok).toBe(true);
  });

  it("rejects a missing name", () => {
    const result = icbc({ name: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.name).toBeDefined();
  });

  it("rejects a missing phone", () => {
    // Without a number the clinic has no way to complete the callback the
    // form exists to request.
    const result = icbc({ phone: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.phone).toBeDefined();
  });

  it.each(["123", "n/a", "call me", "()-  ."])("rejects undialable phone %j", (phone) => {
    const result = icbc({ phone });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.phone).toBeDefined();
  });

  it("keeps email optional but still format-checked", () => {
    expect(icbc({ email: "" }).ok).toBe(true);
    expect(icbc({ email: "bad@" }).ok).toBe(false);
  });

  it("carries the claim number through as a distinct field", () => {
    const result = icbc({ claim_number: "AB-12345" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.claimNumber).toBe("AB-12345");
  });
});

describe("feedback form", () => {
  it("stays anonymous-friendly", () => {
    const result = validateContactPayload({ formName: "feedback", message: "Great visit" });
    expect(result.ok).toBe(true);
  });

  it("still rejects a malformed email when one is given", () => {
    const result = validateContactPayload({
      formName: "feedback",
      email: "nope",
      message: "Great visit",
    });
    expect(result.ok).toBe(false);
  });
});

describe("field extras are scoped to their form", () => {
  it("drops callback_time and claim_number from forms that don't declare them", () => {
    const result = validateContactPayload(
      body({ callback_time: "Morning (8am–12pm)", claim_number: "AB-12345" })
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.callbackTime).toBe("");
      expect(result.data.claimNumber).toBe("");
    }
  });
});

describe("length limits", () => {
  it("rejects an over-long message", () => {
    const result = validateContactPayload(body({ message: "x".repeat(4001) }));
    expect(result.ok).toBe(false);
  });

  it("accepts a message at the limit", () => {
    const result = validateContactPayload(body({ message: "x".repeat(4000) }));
    expect(result.ok).toBe(true);
  });

  it("rejects an over-long name", () => {
    expect(validateContactPayload(body({ name: "x".repeat(101) })).ok).toBe(false);
  });
});

describe("isCallablePhone", () => {
  it.each(["604-555-0132", "+1 (604) 555-0132", "6045550132", "604 555 0132 x12"])(
    "accepts %j",
    (value) => expect(isCallablePhone(value)).toBe(true)
  );

  it.each(["", "   ", "123", "abc", "1".repeat(20)])("rejects %j", (value) =>
    expect(isCallablePhone(value)).toBe(false)
  );
});
