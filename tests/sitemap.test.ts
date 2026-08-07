import { describe, expect, it } from "vitest";

import sitemap from "@/app/sitemap";

const entries = sitemap();

describe("sitemap contents", () => {
  it("lists the public pages", () => {
    const paths = entries.map((e) => new URL(e.url).pathname);
    expect(paths).toContain("/");
    expect(paths).toContain("/services");
    expect(paths).toContain("/contact");
  });

  it("omits the noindex intake page", () => {
    // Listing a noindex URL tells crawlers two contradictory things about the
    // same page; the intake form is deliberately not a search landing surface.
    const paths = entries.map((e) => new URL(e.url).pathname);
    expect(paths).not.toContain("/intake");
  });

  it("has no duplicate URLs", () => {
    const urls = entries.map((e) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("uses absolute https URLs", () => {
    for (const entry of entries) {
      expect(entry.url).toMatch(/^https:\/\//);
    }
  });
});

describe("lastModified", () => {
  it("is not simply the build time", () => {
    // The regression this guards: every route previously reported new Date(),
    // so each deploy claimed the whole site had just changed and crawlers
    // learned to ignore the field.
    const now = Date.now();
    for (const entry of entries) {
      if (!entry.lastModified) continue;
      const value = new Date(entry.lastModified).getTime();
      expect(Math.abs(now - value)).toBeGreaterThan(60_000);
    }
  });

  it("comes from the committed content date", () => {
    const withDates = entries.filter((e) => e.lastModified);
    expect(withDates.length).toBeGreaterThan(0);
  });

  it("gives blog posts their own authored dates", () => {
    const posts = entries.filter((e) => new URL(e.url).pathname.startsWith("/blog/"));
    expect(posts.length).toBeGreaterThan(0);
    // Posts carry front-matter dates, so they should not all share one value
    // with the rest of the site.
    const postDates = new Set(posts.map((p) => String(p.lastModified)));
    expect(postDates.size).toBeGreaterThan(0);
  });

  it("never emits an invalid date", () => {
    for (const entry of entries) {
      if (!entry.lastModified) continue;
      expect(Number.isNaN(new Date(entry.lastModified).getTime())).toBe(false);
    }
  });
});
