import { describe, expect, it } from "vitest";

import { __parseToggle, isAiAssistantAvailable } from "@/lib/ai-config";

describe("toggle parsing", () => {
  it("defaults to on when unset or empty", () => {
    // An existing deployment that never set the variable keeps its assistant.
    expect(__parseToggle(undefined)).toBe(true);
    expect(__parseToggle("")).toBe(true);
    expect(__parseToggle("   ")).toBe(true);
  });

  it.each(["0", "false", "off", "no", "FALSE", "Off", " NO "])(
    "treats %j as off",
    (value) => {
      // These are the spellings someone is plausibly going to type into a
      // settings box; all of them must mean the same thing.
      expect(__parseToggle(value)).toBe(false);
    }
  );

  it.each(["1", "true", "on", "yes", "TRUE"])("treats %j as on", (value) => {
    expect(__parseToggle(value)).toBe(true);
  });

  it("treats an unrecognised value as on rather than silently disabling", () => {
    // Failing open matters here: a typo should not quietly remove a feature
    // the clinic is paying for and believes is running.
    expect(__parseToggle("enabled")).toBe(true);
  });
});

describe("isAiAssistantAvailable", () => {
  it("is available with a key and no explicit switch", () => {
    expect(isAiAssistantAvailable({ OPENAI_API_KEY: "sk-test" })).toBe(true);
  });

  it("is unavailable without a key, whatever the switch says", () => {
    // The switch being on cannot conjure a key; the route would fail on every
    // call, so it must report itself unavailable instead.
    expect(isAiAssistantAvailable({ NEXT_PUBLIC_AI_ASSISTANT_ENABLED: "true" })).toBe(false);
    expect(isAiAssistantAvailable({ OPENAI_API_KEY: "   " })).toBe(false);
    expect(isAiAssistantAvailable({})).toBe(false);
  });

  it("is unavailable when the clinic switches it off", () => {
    expect(
      isAiAssistantAvailable({
        OPENAI_API_KEY: "sk-test",
        NEXT_PUBLIC_AI_ASSISTANT_ENABLED: "false",
      })
    ).toBe(false);
  });

  it("is available again when switched back on", () => {
    expect(
      isAiAssistantAvailable({
        OPENAI_API_KEY: "sk-test",
        NEXT_PUBLIC_AI_ASSISTANT_ENABLED: "true",
      })
    ).toBe(true);
  });
});
