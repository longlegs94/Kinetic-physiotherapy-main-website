import { describe, expect, it } from "vitest";

import { detectRedFlags, detectRedFlagsIn, emergencyMessage } from "@/lib/red-flags";

describe("detectRedFlags", () => {
  it.each([
    ["cardiac", "I have chest pain and it's spreading"],
    ["cardiac", "Might be having a heart attack"],
    ["stroke", "my face is drooping and I can't speak properly"],
    ["stroke", "sudden weakness on one side of my body"],
    ["stroke", "worst headache of my life came on suddenly"],
    ["breathing", "I can't breathe properly since the accident"],
    ["breathing", "shortness of breath when I lie down"],
    ["head-injury", "I hit my head and lost consciousness"],
    ["head-injury", "had a seizure yesterday"],
    ["cauda-equina", "lower back pain and I've lost bladder control"],
    ["cauda-equina", "numbness in my groin and both legs are weak"],
    ["cauda-equina", "saddle numbness after lifting"],
    ["severe-bleeding", "the cut won't stop bleeding"],
    ["fracture", "the bone is sticking out of my leg"],
    ["self-harm", "sometimes I want to kill myself"],
  ])("flags %s: %j", (category, input) => {
    const result = detectRedFlags(input);
    expect(result.triggered).toBe(true);
    expect(result.categories).toContain(category);
  });

  it.each([
    "I tweaked my shoulder at the gym last week",
    "Looking to book a massage for tension in my neck",
    "ICBC claim after a minor rear-end collision, some stiffness",
    "My knee aches when I run more than 5k",
    "Can I get an appointment number for Thursday?",
    "",
    "   ",
  ])("does not flag ordinary intake text: %j", (input) => {
    expect(detectRedFlags(input).triggered).toBe(false);
  });

  it("is case-insensitive and tolerates curly apostrophes", () => {
    expect(detectRedFlags("I CAN'T BREATHE").triggered).toBe(true);
    expect(detectRedFlags("I can’t breathe").triggered).toBe(true);
  });

  it("does not over-match substrings inside ordinary words", () => {
    // "numb" inside "number" must not trigger the cauda-equina rule.
    expect(detectRedFlags("My claim number is 12345").triggered).toBe(false);
  });

  it("reports every distinct category present", () => {
    const result = detectRedFlags("chest pain and I can't breathe");
    expect(result.categories).toEqual(expect.arrayContaining(["cardiac", "breathing"]));
  });
});

describe("detectRedFlagsIn", () => {
  it("scans across fields and de-duplicates categories", () => {
    const result = detectRedFlagsIn([
      "Back pain",
      undefined,
      "lost bladder control",
      "numbness in my groin",
    ]);
    expect(result.triggered).toBe(true);
    expect(result.categories).toEqual(["cauda-equina"]);
  });

  it("returns clean for entirely ordinary input", () => {
    expect(detectRedFlagsIn(["shoulder", "3 weeks ago", undefined]).triggered).toBe(false);
  });
});

describe("emergencyMessage", () => {
  it("directs to emergency services and never invites booking", () => {
    const message = emergencyMessage(["cardiac"], "604-555-0100");
    expect(message).toContain("911");
    expect(message).toContain("604-555-0100");
    expect(message.toLowerCase()).not.toContain("book");
  });

  it("routes self-harm to the crisis line specifically", () => {
    const message = emergencyMessage(["self-harm"], "604-555-0100");
    expect(message).toContain("988");
  });

  it("never echoes the visitor's own words back", () => {
    // The message is built from the category alone, so patient text cannot
    // leak into a response that might be logged or screenshotted.
    const message = emergencyMessage(["cardiac", "breathing"], "604-555-0100");
    expect(message).not.toContain("cardiac");
  });
});
