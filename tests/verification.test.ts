import { describe, expect, it } from "vitest";

import { collectUnverifiedContent, filterVerified, isVerified } from "@/lib/verification";

describe("isVerified", () => {
  it("treats an unflagged item as publishable", () => {
    expect(isVerified({})).toBe(true);
    expect(isVerified({ needsVerification: false })).toBe(true);
  });

  it("withholds an explicitly flagged item", () => {
    expect(isVerified({ needsVerification: true })).toBe(false);
  });
});

describe("filterVerified", () => {
  type Item = { id: string; needsVerification?: boolean };

  it("drops flagged entries and preserves order", () => {
    const items: Item[] = [
      { id: "a" },
      { id: "b", needsVerification: true },
      { id: "c", needsVerification: false },
    ];
    expect(filterVerified(items).map((i) => i.id)).toEqual(["a", "c"]);
  });

  it("returns a copy rather than the original array", () => {
    const items: Item[] = [{ id: "a" }];
    expect(filterVerified(items)).not.toBe(items);
  });

  it("handles an empty list", () => {
    expect(filterVerified([])).toEqual([]);
  });
});

describe("collectUnverifiedContent", () => {
  const paths = collectUnverifiedContent();

  it("finds the entries still awaiting clinic confirmation", () => {
    // Guards against the gate silently reporting nothing because the shape of
    // site-content.json changed underneath it.
    expect(paths.length).toBeGreaterThan(0);
  });

  it("reports human-locatable paths", () => {
    for (const path of paths) {
      expect(path).toMatch(/^(clinic|services|practitioners|testimonials|faqs)[.[]/);
    }
  });

  it("never includes the content itself, only its location", () => {
    // The report is printed in build logs, so it must not carry testimonial
    // text or practitioner bios.
    for (const path of paths) {
      expect(path.length).toBeLessThan(120);
    }
  });
});
