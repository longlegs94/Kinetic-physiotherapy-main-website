import { describe, expect, it } from "vitest";

import { collectContentEnvProblems } from "@/lib/admin/content-repo";
import type { ClinicInput, PractitionerInput } from "@/lib/admin/content-schema";
import {
  applyClinic,
  getPractitioner,
  listPractitioners,
  removePractitioner,
  upsertPractitioner,
  validateClinic,
  validatePractitioner,
} from "@/lib/admin/content-schema";

/** The shape of the parts of site-content.json these tests touch. */
type ContentDoc = {
  clinic: Record<string, unknown>;
  practitioners: Record<string, unknown>[];
  services: unknown[];
};

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

function practitionerInput(overrides: Partial<PractitionerInput> = {}): PractitionerInput {
  return {
    name: "Priya Singh",
    title: "Physiotherapist",
    category: "Physiotherapy",
    bio: "",
    specialInterests: [],
    languages: [],
    icbcAccepted: false,
    schedule: "",
    bookingUrl: "",
    ...overrides,
  };
}

function sampleContent(): ContentDoc {
  return {
    clinic: { name: "Kinetic Physiotherapy" },
    practitioners: [
      { name: "Alex Chen", title: "RMT", category: "Massage Therapy", icbcAccepted: true },
      {
        name: "Bo Nguyen",
        title: "Physiotherapist",
        category: "Physiotherapy",
        icbcAccepted: false,
        image: "/photos/bo.jpg",
        needsVerification: true,
      },
    ],
    services: [],
  };
}

describe("upsertPractitioner", () => {
  it("appends when index is null", () => {
    const content = sampleContent();
    const result = upsertPractitioner(content, null, practitionerInput({ name: "Cy Park" })) as ContentDoc;
    expect(result.practitioners).toHaveLength(3);
    expect(result.practitioners[2].name).toBe("Cy Park");
  });

  it("replaces in place when given an index, without changing the list length", () => {
    const content = sampleContent();
    const input = practitionerInput({ name: "Alex Chen Jr" });
    const result = upsertPractitioner(content, 0, input) as ContentDoc;
    expect(result.practitioners).toHaveLength(2);
    expect(result.practitioners[0].name).toBe("Alex Chen Jr");
    expect(result.practitioners[1].name).toBe("Bo Nguyen");
  });

  it(
    "preserves an existing image and needsVerification:true on edit, so a portal edit can't " +
      "silently mark an unverified credential verified or drop a photo the form doesn't expose",
    () => {
      const content = sampleContent();
      const input = practitionerInput({ name: "Bo Nguyen", bio: "Updated bio" });
      const result = upsertPractitioner(content, 1, input) as ContentDoc;
      expect(result.practitioners[1].image).toBe("/photos/bo.jpg");
      expect(result.practitioners[1].needsVerification).toBe(true);
    }
  );

  it("does not invent needsVerification or image when the previous entry had neither", () => {
    const content = sampleContent();
    const result = upsertPractitioner(content, 0, practitionerInput({ name: "Alex Chen" })) as ContentDoc;
    expect(result.practitioners[0]).not.toHaveProperty("needsVerification");
    expect(result.practitioners[0]).not.toHaveProperty("image");
  });

  it("omits optional fields entirely rather than writing empty strings", () => {
    const content = sampleContent();
    const result = upsertPractitioner(content, null, practitionerInput()) as ContentDoc;
    const added = result.practitioners[2];
    expect(added).not.toHaveProperty("bio");
    expect(added).not.toHaveProperty("specialInterests");
    expect(added).not.toHaveProperty("languages");
    expect(added).not.toHaveProperty("schedule");
    expect(added).not.toHaveProperty("bookingUrl");
  });

  it("leaves other top-level keys (clinic, services) untouched", () => {
    const content = sampleContent();
    const result = upsertPractitioner(content, null, practitionerInput()) as ContentDoc;
    expect(result.clinic).toBe(content.clinic);
    expect(result.services).toBe(content.services);
  });

  it("throws for an out-of-range index", () => {
    const content = sampleContent();
    expect(() => upsertPractitioner(content, 5, practitionerInput())).toThrow();
  });
});

describe("removePractitioner", () => {
  it("removes only the target and leaves the rest in order", () => {
    const content: ContentDoc = {
      clinic: { name: "Kinetic Physiotherapy" },
      practitioners: [
        { name: "Alex Chen", title: "RMT", category: "Massage Therapy" },
        { name: "Bo Nguyen", title: "Physiotherapist", category: "Physiotherapy" },
        { name: "Cy Park", title: "Physiotherapist", category: "Physiotherapy" },
      ],
      services: [],
    };
    const result = removePractitioner(content, 1) as ContentDoc;
    expect(result.practitioners.map((p) => p.name)).toEqual(["Alex Chen", "Cy Park"]);
  });

  it("throws for an out-of-range index", () => {
    const content = sampleContent();
    expect(() => removePractitioner(content, 5)).toThrow();
  });
});

describe("getPractitioner / listPractitioners", () => {
  it("getPractitioner returns the entry at the index, or null past the end", () => {
    const content = sampleContent();
    expect(getPractitioner(content, 1)?.name).toBe("Bo Nguyen");
    expect(getPractitioner(content, 5)).toBeNull();
  });

  it("listPractitioners throws when the content has no practitioners array", () => {
    expect(() => listPractitioners({ clinic: {} })).toThrow();
  });
});

/* ------------------------------------------------------------------ *
 * validateClinic
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

function baseClinicContent(): ContentDoc {
  return {
    clinic: {
      name: "Old Name",
      positioning: "Old tagline",
      city: "Vancouver",
      province: "British Columbia",
      country: "Canada",
      address: "1 Old St",
      phone: "604-000-0000",
      email: "old@example.com",
      fax: "604-000-1111",
      janeBookingUrl: "https://old.janeapp.com",
      socials: { facebook: "https://facebook.com/old" },
      trustBadges: ["College of Massage Therapists of BC"],
      hours: [
        { days: "Mon–Fri", hours: "8:00am–6:00pm", needsVerification: true },
        { days: "Sat", hours: "9:00am–2:00pm", needsVerification: false },
      ],
    },
    practitioners: [],
    services: [],
  };
}

function clinicInput(overrides: Partial<ClinicInput> = {}): ClinicInput {
  return {
    name: "New Name",
    positioning: "New tagline",
    city: "Vancouver",
    province: "British Columbia",
    country: "Canada",
    address: "2 New St",
    phone: "604-111-2222",
    email: "new@example.com",
    fax: "",
    janeBookingUrl: "https://new.janeapp.com",
    facebook: "",
    instagram: "",
    hours: [{ days: "Mon–Fri", hours: "8:00am–6:00pm" }],
    ...overrides,
  };
}

describe("applyClinic", () => {
  it("writes the edited fields", () => {
    const result = applyClinic(baseClinicContent(), clinicInput()) as ContentDoc;
    expect(result.clinic.name).toBe("New Name");
    expect(result.clinic.address).toBe("2 New St");
    expect(result.clinic.phone).toBe("604-111-2222");
  });

  it("omits fax and socials when blank rather than writing empty values", () => {
    const input = clinicInput({ fax: "", facebook: "", instagram: "" });
    const result = applyClinic(baseClinicContent(), input) as ContentDoc;
    expect(result.clinic).not.toHaveProperty("fax");
    expect(result.clinic).not.toHaveProperty("socials");
  });

  it("carries trustBadges through untouched, since the form does not expose them", () => {
    const content = baseClinicContent();
    const result = applyClinic(content, clinicInput()) as ContentDoc;
    expect(result.clinic.trustBadges).toBe(content.clinic.trustBadges);
  });

  it("preserves needsVerification:true on an hours row whose days label is unchanged", () => {
    // Re-saving the form must not quietly promote an unconfirmed hours row to
    // confirmed just because the admin edited an unrelated field.
    const content = baseClinicContent();
    const input = clinicInput({
      hours: [
        { days: "Mon–Fri", hours: "8:00am–6:00pm" },
        { days: "Sun", hours: "Closed" },
      ],
    });
    const result = applyClinic(content, input) as ContentDoc;
    expect(result.clinic.hours).toEqual([
      { days: "Mon–Fri", hours: "8:00am–6:00pm", needsVerification: true },
      { days: "Sun", hours: "Closed", needsVerification: false },
    ]);
  });

  it("leaves other top-level keys untouched", () => {
    const content = baseClinicContent();
    const result = applyClinic(content, clinicInput()) as ContentDoc;
    expect(result.practitioners).toBe(content.practitioners);
    expect(result.services).toBe(content.services);
  });
});

/* ------------------------------------------------------------------ *
 * collectContentEnvProblems
 * ------------------------------------------------------------------ */

describe("collectContentEnvProblems", () => {
  it("is silent when neither variable is set", () => {
    // The default for this repo: content editing off, portal degrades to a
    // viewer, not a misconfiguration worth failing a build over.
    expect(collectContentEnvProblems({})).toEqual([]);
  });

  it("is silent when both are set correctly", () => {
    const problems = collectContentEnvProblems({
      CONTENT_GITHUB_TOKEN: "x",
      CONTENT_GITHUB_REPO: "a/b",
    });
    expect(problems).toEqual([]);
  });

  it("flags a token with no repo to write to", () => {
    const problems = collectContentEnvProblems({ CONTENT_GITHUB_TOKEN: "x" });
    expect(problems.map((p) => p.variable)).toContain("CONTENT_GITHUB_REPO");
  });

  it("flags a repo with no token to authenticate the write", () => {
    const problems = collectContentEnvProblems({ CONTENT_GITHUB_REPO: "a/b" });
    expect(problems.map((p) => p.variable)).toContain("CONTENT_GITHUB_TOKEN");
  });

  it("flags a CONTENT_GITHUB_REPO that is not owner/repo form", () => {
    const problems = collectContentEnvProblems({
      CONTENT_GITHUB_TOKEN: "x",
      CONTENT_GITHUB_REPO: "not-a-slug",
    });
    expect(problems).toHaveLength(1);
    expect(problems[0].variable).toBe("CONTENT_GITHUB_REPO");
    expect(problems[0].problem).toMatch(/owner\/repo/);
  });
});
