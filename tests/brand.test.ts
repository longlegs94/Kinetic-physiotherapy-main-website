import { describe, expect, it } from "vitest";

import { BRAND_TOKEN, withBrand } from "@/lib/brand";
import { pageMetadata } from "@/lib/seo";
import { locations, locationSchema } from "@/content/locations";
import raw from "@/content/site-content.json";

describe("withBrand", () => {
  it("substitutes the live clinic name", () => {
    expect(withBrand("About {brand} | Maple Ridge", "Kinetic Physiotherapy")).toBe(
      "About Kinetic Physiotherapy | Maple Ridge"
    );
  });

  it("replaces every occurrence, not just the first", () => {
    expect(withBrand("{brand} — book with {brand}", "Clinic")).toBe(
      "Clinic — book with Clinic"
    );
  });

  it("leaves copy without the token untouched", () => {
    expect(withBrand("Physiotherapy in Maple Ridge", "Clinic")).toBe(
      "Physiotherapy in Maple Ridge"
    );
  });

  it("exports the token it substitutes, so callers can build strings with it", () => {
    expect(withBrand(`Post | ${BRAND_TOKEN}`, "Clinic")).toBe("Post | Clinic");
  });
});

describe("pageMetadata brand substitution", () => {
  const meta = pageMetadata(
    { title: "About {brand}", description: "{brand} is in Maple Ridge.", path: "/about" },
    "Kinetic Physiotherapy"
  );

  it("substitutes in the title, description and social copy", () => {
    expect(meta.title).toEqual({ absolute: "About Kinetic Physiotherapy" });
    expect(meta.description).toBe("Kinetic Physiotherapy is in Maple Ridge.");
    expect(meta.openGraph?.title).toBe("About Kinetic Physiotherapy");
    expect(meta.openGraph?.siteName).toBe("Kinetic Physiotherapy");
    expect(meta.twitter?.description).toBe("Kinetic Physiotherapy is in Maple Ridge.");
  });
});

/**
 * A `{brand}` left in a string nobody substitutes reaches a visitor verbatim,
 * which is worse than the stale name it replaced. These pin the two data files
 * that carry the token to the surfaces that resolve it.
 */
describe("brand tokens only appear where something substitutes them", () => {
  it("is confined to metadata and hero copy in the site content", () => {
    const content = raw as Record<string, unknown>;
    const clinic = content.clinic as { name: string };
    expect(clinic.name).not.toContain(BRAND_TOKEN);
    expect(JSON.stringify(content.services ?? [])).not.toContain(BRAND_TOKEN);
    expect(JSON.stringify(content.practitioners ?? [])).not.toContain(BRAND_TOKEN);
  });

  it("only appears in location fields the pages run through withBrand", () => {
    const substituted = new Set(["heroSubtitle", "metaTitle", "metaDescription", "intro"]);
    for (const location of locations) {
      for (const [field, value] of Object.entries(location)) {
        if (substituted.has(field)) continue;
        expect(JSON.stringify(value), `${location.slug}.${field}`).not.toContain(BRAND_TOKEN);
      }
    }
  });
});

describe("location JSON-LD", () => {
  it("substitutes the brand in the description it publishes", () => {
    const albion = locations.find((l) => l.slug === "albion")!;
    const schema = locationSchema(albion, "Kinetic Physiotherapy");
    expect(schema.description).not.toContain(BRAND_TOKEN);
    expect(schema.description).toContain("Kinetic Physiotherapy");
    expect(schema.name).toBe("Kinetic Physiotherapy — serving Albion");
    expect(schema.provider.name).toBe("Kinetic Physiotherapy");
  });
});
