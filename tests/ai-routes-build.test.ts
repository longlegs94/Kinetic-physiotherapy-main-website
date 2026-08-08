import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Regression test for a real build failure: unlike the Anthropic SDK this
 * codebase used to call, OpenAI's client throws synchronously at
 * construction when it finds no API key anywhere in the environment. Both
 * AI routes construct their client at module scope, which Next.js evaluates
 * while collecting route configuration during `next build` — so an
 * unconfigured deploy (a state this site is explicitly designed to tolerate;
 * see lib/env.ts and the GET `enabled` flags on both routes) previously
 * failed the production build outright rather than degrading gracefully.
 *
 * This imports each route module fresh with OPENAI_API_KEY deliberately
 * unset and asserts the import itself does not throw — the same condition
 * `next build` hit.
 */

const originalKey = process.env.OPENAI_API_KEY;

afterEach(() => {
  if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = originalKey;
  vi.resetModules();
});

describe("AI route modules import cleanly without OPENAI_API_KEY", () => {
  it("app/api/concierge/route.ts", async () => {
    delete process.env.OPENAI_API_KEY;
    vi.resetModules();
    await expect(import("@/app/api/concierge/route")).resolves.toBeDefined();
  });

  it("app/api/intake/route.ts", async () => {
    delete process.env.OPENAI_API_KEY;
    vi.resetModules();
    await expect(import("@/app/api/intake/route")).resolves.toBeDefined();
  });
});

describe("GET reports configuration state honestly", () => {
  it("reports disabled when OPENAI_API_KEY is unset", async () => {
    delete process.env.OPENAI_API_KEY;
    vi.resetModules();
    const { GET } = await import("@/app/api/concierge/route");
    const res = await GET();
    const body = await res.json();
    expect(body).toEqual({ enabled: false });
  });

  it("reports enabled once OPENAI_API_KEY is set", async () => {
    process.env.OPENAI_API_KEY = "sk-test-key";
    vi.resetModules();
    const { GET } = await import("@/app/api/concierge/route");
    const res = await GET();
    const body = await res.json();
    expect(body).toEqual({ enabled: true });
  });
});
