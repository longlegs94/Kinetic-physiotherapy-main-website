import { describe, expect, it } from "vitest";

import { collectEnvProblems, parseGoogleReviewUrl } from "@/lib/env";

describe("parseGoogleReviewUrl", () => {
  it("accepts a real writereview link", () => {
    const url = "https://search.google.com/local/writereview?placeid=ChIJAbC123";
    expect(parseGoogleReviewUrl(url)).toBe(url);
  });

  it.each([
    "https://g.page/r/AbCdEf/review",
    "https://maps.app.goo.gl/AbCdEf",
  ])("accepts Google short link %j", (url) => {
    expect(parseGoogleReviewUrl(url)).toBe(url);
  });

  it("rejects the REPLACE_ME placeholder", () => {
    // The regression this guards: the placeholder used to ship as a live link,
    // sending visitors who clicked "Leave a Google review" to a Google error.
    expect(
      parseGoogleReviewUrl("https://search.google.com/local/writereview?placeid=REPLACE_ME")
    ).toBeNull();
  });

  it("rejects a writereview link with no place id", () => {
    expect(parseGoogleReviewUrl("https://search.google.com/local/writereview")).toBeNull();
    expect(parseGoogleReviewUrl("https://search.google.com/local/writereview?placeid=")).toBeNull();
  });

  it.each([undefined, "", "   "])("treats %j as unconfigured", (value) => {
    expect(parseGoogleReviewUrl(value)).toBeNull();
  });

  it("rejects a non-Google host", () => {
    // A build var shouldn't be able to repoint the review button anywhere.
    expect(parseGoogleReviewUrl("https://evil.example.com/review")).toBeNull();
  });

  it("rejects non-https", () => {
    expect(parseGoogleReviewUrl("http://search.google.com/local/writereview?placeid=abc")).toBeNull();
  });

  it("rejects a malformed URL", () => {
    expect(parseGoogleReviewUrl("not a url")).toBeNull();
  });

  it.each(["PLACEHOLDER", "todo", "changeme"])("rejects placeholder marker %j", (marker) => {
    expect(parseGoogleReviewUrl(`https://g.page/r/${marker}/review`)).toBeNull();
  });
});

describe("collectEnvProblems", () => {
  const ok = { NEXT_PUBLIC_SITE_URL: "https://www.kinetictherapyclinic.ca" };

  it("passes a well-formed environment", () => {
    expect(collectEnvProblems(ok)).toEqual([]);
  });

  it("requires NEXT_PUBLIC_SITE_URL", () => {
    const problems = collectEnvProblems({});
    expect(problems.map((p) => p.variable)).toContain("NEXT_PUBLIC_SITE_URL");
  });

  it.each([
    ["http (not https)", "http://www.kinetictherapyclinic.ca"],
    ["trailing slash", "https://www.kinetictherapyclinic.ca/"],
    ["not a URL", "kinetictherapyclinic"],
  ])("flags a site URL with %s", (_label, NEXT_PUBLIC_SITE_URL) => {
    expect(collectEnvProblems({ NEXT_PUBLIC_SITE_URL }).length).toBeGreaterThan(0);
  });

  it("flags a review URL that is set but unusable", () => {
    const problems = collectEnvProblems({
      ...ok,
      NEXT_PUBLIC_GOOGLE_REVIEW_URL: "https://search.google.com/local/writereview?placeid=REPLACE_ME",
    });
    expect(problems.map((p) => p.variable)).toContain("NEXT_PUBLIC_GOOGLE_REVIEW_URL");
  });

  it("does not flag an unset review URL", () => {
    // Absent is a valid state — the UI hides the card. Only a *broken* value
    // is a build failure.
    expect(collectEnvProblems(ok)).toEqual([]);
  });

  it("does not fail the build over optional integrations", () => {
    // Analytics and the concierge degrade cleanly; blocking a deploy over
    // them would be wrong.
    expect(collectEnvProblems({ ...ok, NEXT_PUBLIC_GA_ID: "", ANTHROPIC_API_KEY: "" })).toEqual([]);
  });
});
