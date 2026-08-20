import { describe, expect, it } from "vitest";

import { validateClinic, validatePractitioner } from "@/lib/admin/content-schema";
import { collectSupabaseEnvProblems } from "@/lib/content/supabase";

/* ------------------------------------------------------------------ *
 * validatePractitioner
 * ------------------------------------------------------------------ */

describe("validatePractitioner", () => {
  function form(overrides: Record<string, string> = {}): FormData {
    const fd = new FormData();
    const defaults = {
      name: "Jane Doe",
      title: "Registered Massage Therapist",
      category: "Massage Therapy",
      ...overrides,
    };
    for (const [key, value] of Object.entries(defaults)) fd.set(key, value);
    return fd;
  }

  it("accepts a minimal valid entry", () => {
    const result = validatePractitioner(form());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        name: "Jane Doe",
        title: "Registered Massage Therapist",
        category: "Massage Therapy",
        bio: "",
        specialInterests: [],
        languages: [],
        icbcAccepted: false,
        schedule: "",
        bookingUrl: "",
      });
    }
  });

  it.each(["name", "title", "category"])("requires %s", (field) => {
    const fd = form();
    fd.delete(field);
    const result = validatePractitioner(fd);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.map((e) => e.field)).toContain(field);
  });

  it("trims and collapses whitespace, including non-breaking spaces", () => {
    // A paste from Word or a clinic's old website tends to carry these; the
    // card should never render a name full of doubled or non-breaking gaps.
    const result = validatePractitioner(form({ name: "  Jane   \tDoe  " }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.name).toBe("Jane Doe");
  });

  it("splits specialInterests and languages on newlines, dropping blank lines", () => {
    const fd = form({
      specialInterests: "Sports injuries\n\nPost-surgical\n   \nPelvic health",
      languages: "English\n\nPunjabi\n",
    });
    const result = validatePractitioner(fd);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.specialInterests).toEqual([
        "Sports injuries",
        "Post-surgical",
        "Pelvic health",
      ]);
      expect(result.value.languages).toEqual(["English", "Punjabi"]);
    }
  });

  it('reads icbcAccepted as true for "on" and false when the field is absent', () => {
    const checked = validatePractitioner(form({ icbcAccepted: "on" }));
    const unchecked = validatePractitioner(form());
    expect(checked.ok).toBe(true);
    expect(unchecked.ok).toBe(true);
    if (checked.ok) expect(checked.value.icbcAccepted).toBe(true);
    if (unchecked.ok) expect(unchecked.value.icbcAccepted).toBe(false);
  });

  it.each(["http://x.com", "javascript:alert(1)", "not a url"])(
    "rejects a bookingUrl that is not https (%s)",
    (bookingUrl) => {
      const result = validatePractitioner(form({ bookingUrl }));
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.map((e) => e.field)).toContain("bookingUrl");
    }
  );

  it("accepts an empty bookingUrl, since it is optional", () => {
    const result = validatePractitioner(form({ bookingUrl: "" }));
    expect(result.ok).toBe(true);
  });

  it("rejects a name over the 120 character limit", () => {
    const result = validatePractitioner(form({ name: "x".repeat(121) }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.map((e) => e.field)).toContain("name");
  });
});

/* ------------------------------------------------------------------ *
 * upsertPractitioner / removePractitioner / getPractitioner / listPractitioners
 * ------------------------------------------------------------------ */

describe("validateClinic", () => {
  function clinicForm(
    overrides: Record<string, string> = {},
    hours: Array<[string, string]> = [["Mon–Fri", "8:00am–6:00pm"]]
  ): FormData {
    const fd = new FormData();
    const defaults = {
      name: "Kinetic Physiotherapy",
      positioning: "Move better, feel better",
      city: "Vancouver",
      province: "British Columbia",
      country: "Canada",
      address: "123 Main St, Vancouver, BC",
      phone: "604-555-0100",
      email: "info@kinetic.example",
      fax: "",
      janeBookingUrl: "https://kinetic.janeapp.com",
      facebook: "",
      instagram: "",
      ...overrides,
    };
    for (const [key, value] of Object.entries(defaults)) fd.set(key, value);
    for (const [days, hoursValue] of hours) {
      fd.append("hoursDays", days);
      fd.append("hoursValue", hoursValue);
    }
    return fd;
  }

  it("accepts a full valid form", () => {
    const result = validateClinic(clinicForm());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe("Kinetic Physiotherapy");
      expect(result.value.janeBookingUrl).toBe("https://kinetic.janeapp.com");
      expect(result.value.hours).toEqual([{ days: "Mon–Fri", hours: "8:00am–6:00pm" }]);
    }
  });

  it.each(["phone", "email", "address", "city", "province", "country", "name", "janeBookingUrl"])(
    "requires %s",
    (field) => {
      const result = validateClinic(clinicForm({ [field]: "" }));
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.map((e) => e.field)).toContain(field);
    }
  );

  it("rejects a malformed email", () => {
    const result = validateClinic(clinicForm({ email: "not-an-email" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.map((e) => e.field)).toContain("email");
  });

  it("rejects a phone with too few digits to dial", () => {
    const result = validateClinic(clinicForm({ phone: "604-555" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.map((e) => e.field)).toContain("phone");
  });

  it("pairs hoursDays/hoursValue into rows, skipping a fully-blank row", () => {
    const result = validateClinic(
      clinicForm({}, [
        ["Mon–Fri", "8:00am–6:00pm"],
        ["", ""],
        ["Sat", "9:00am–2:00pm"],
      ])
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.hours).toEqual([
        { days: "Mon–Fri", hours: "8:00am–6:00pm" },
        { days: "Sat", hours: "9:00am–2:00pm" },
      ]);
    }
  });

  it("errors when a row has only one half filled", () => {
    // A day with no time (or the reverse) would render as a broken line in
    // the footer and in the LocalBusiness opening-hours data Google reads.
    const result = validateClinic(
      clinicForm({}, [
        ["Mon–Fri", "8:00am–6:00pm"],
        ["Sat", ""],
      ])
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.map((e) => e.field)).toContain("hours.1");
  });

  it("errors when there are no hours rows at all", () => {
    const result = validateClinic(clinicForm({}, []));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.map((e) => e.field)).toContain("hours");
  });
});

/* ------------------------------------------------------------------ *
 * applyClinic
 * ------------------------------------------------------------------ */

describe("collectSupabaseEnvProblems", () => {
  const URL_OK = "https://abcdefgh.supabase.co";

  it("is silent when the database isn't configured at all", () => {
    // A valid state: the site serves the content bundled at build time.
    expect(collectSupabaseEnvProblems({})).toEqual([]);
  });

  it("is silent for a complete read-and-write configuration", () => {
    expect(
      collectSupabaseEnvProblems({
        SUPABASE_URL: URL_OK,
        SUPABASE_ANON_KEY: "anon",
        SUPABASE_SERVICE_ROLE_KEY: "service",
      })
    ).toEqual([]);
  });

  it("accepts read-only configuration, since a viewer deployment is legitimate", () => {
    expect(
      collectSupabaseEnvProblems({ SUPABASE_URL: URL_OK, SUPABASE_ANON_KEY: "anon" })
    ).toEqual([]);
  });

  it("flags a key with no URL to point it at", () => {
    const problems = collectSupabaseEnvProblems({ SUPABASE_ANON_KEY: "anon" });
    expect(problems.map((p) => p.variable)).toContain("SUPABASE_URL");
  });

  it("flags a URL with no key to read with", () => {
    const problems = collectSupabaseEnvProblems({ SUPABASE_URL: URL_OK });
    expect(problems.map((p) => p.variable)).toContain("SUPABASE_ANON_KEY");
  });

  it("flags a malformed URL", () => {
    const problems = collectSupabaseEnvProblems({
      SUPABASE_URL: "abcdefgh.supabase.co",
      SUPABASE_ANON_KEY: "anon",
    });
    expect(problems[0].variable).toBe("SUPABASE_URL");
  });

  it("flags the anon key being pasted in as the service role key", () => {
    // An easy mistake in a settings screen, and one that produces a portal
    // whose Save buttons fail on click rather than anything obviously wrong.
    const problems = collectSupabaseEnvProblems({
      SUPABASE_URL: URL_OK,
      SUPABASE_ANON_KEY: "same",
      SUPABASE_SERVICE_ROLE_KEY: "same",
    });
    expect(problems.map((p) => p.variable)).toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
});
