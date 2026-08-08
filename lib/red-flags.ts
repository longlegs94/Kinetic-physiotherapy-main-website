/**
 * Deterministic emergency ("red flag") detection for free-text health input.
 *
 * Why this exists separately from the model: the system prompts already ask
 * the assistant to redirect emergencies, but a prompt is a request, not a
 * guarantee. A model can be steered off it, can mis-triage, or can simply be
 * unavailable — and the failure mode is a patient describing stroke symptoms
 * to a booking chatbot and being offered an appointment slot. This scan runs
 * before any model call, in plain code, and its verdict cannot be overridden
 * by anything the model or the visitor says.
 *
 * It is intentionally recall-biased: a false positive shows someone an "call
 * 911 / go to emergency" message they didn't need, which is a minor
 * annoyance. A false negative is the serious outcome. It is a safety net, not
 * a triage tool, and never claims to be one.
 *
 * No matched text is ever logged or returned — only the category, so
 * operational visibility never carries patient health information.
 */

export type RedFlagCategory =
  | "cardiac"
  | "stroke"
  | "breathing"
  | "head-injury"
  | "cauda-equina"
  | "severe-bleeding"
  | "fracture"
  | "self-harm";

export type RedFlagResult = {
  triggered: boolean;
  categories: RedFlagCategory[];
};

/**
 * Patterns are matched against lowercased, whitespace-normalised input with
 * word boundaries where a substring would over-match (e.g. "numb" inside
 * "number"). Kept as explicit regexes rather than a keyword list so multi-word
 * symptoms and common phrasings stay readable.
 */
const PATTERNS: { category: RedFlagCategory; patterns: RegExp[] }[] = [
  {
    category: "cardiac",
    patterns: [
      /\bchest (pain|pressure|tightness|tight)\b/,
      /\bpain (in|down) my (left )?arm\b.*\bchest\b/,
      /\bheart attack\b/,
      /\bcardiac arrest\b/,
      /\bangina\b/,
    ],
  },
  {
    category: "stroke",
    patterns: [
      /\bstroke\b/,
      /\bface (is )?(drooping|droop|numb on one side)\b/,
      /\bslurred speech\b/,
      /\bcan'?t speak\b/,
      /\bsudden(ly)? (numb|weak|weakness)\b.*\bone side\b/,
      /\bweakness on one side\b/,
      /\bsudden(ly)? (blurred|double|loss of) vision\b/,
      /\bworst headache of my life\b/,
    ],
  },
  {
    category: "breathing",
    patterns: [
      /\b(can'?t|cannot|trouble|difficulty|struggling to) breath(e|ing)?\b/,
      /\bshort(ness)? of breath\b/,
      /\bchoking\b/,
      /\banaphyla(xis|ctic)\b/,
    ],
  },
  {
    category: "head-injury",
    patterns: [
      /\b(lost|loss of) consciousness\b/,
      /\bknocked out\b/,
      /\bpassed out\b/,
      /\bblacked out\b/,
      /\bskull fracture\b/,
      /\bhead injury\b.*\bvomit/,
      /\bseizure\b/,
    ],
  },
  {
    category: "cauda-equina",
    patterns: [
      // Cauda equina syndrome — a genuine surgical emergency that presents as
      // ordinary back pain, which is exactly the complaint this site invites.
      /\b(loss of|losing|lost) (bladder|bowel) (control|function)\b/,
      /\b(bladder|bowel) incontinence\b/,
      /\bcan'?t (pee|urinate|control my (bladder|bowel))\b/,
      /\bnumbness\b.*\b(groin|saddle|inner thigh|genital)\b/,
      /\bsaddle (numbness|anaesthesia|anesthesia)\b/,
      /\bboth legs (are )?(numb|weak|giving way)\b/,
    ],
  },
  {
    category: "severe-bleeding",
    patterns: [/\b(severe|heavy|uncontrolled|won'?t stop) bleeding\b/, /\bbleeding heavily\b/],
  },
  {
    category: "fracture",
    patterns: [
      /\bbone (is )?(sticking out|through the skin)\b/,
      /\bopen fracture\b/,
      /\bcompound fracture\b/,
      /\bvisibly deformed\b/,
    ],
  },
  {
    category: "self-harm",
    patterns: [
      /\b(kill|hurt|harm) myself\b/,
      /\bsuicid(e|al)\b/,
      /\bend my life\b/,
      /\bdon'?t want to (live|be here)\b/,
    ],
  },
];

function normalise(input: string): string {
  return input
    .toLowerCase()
    .replace(/[‘’]/g, "'") // curly apostrophes → straight
    .replace(/\s+/g, " ")
    .trim();
}

/** Scans free text for emergency indicators. */
export function detectRedFlags(input: string): RedFlagResult {
  const text = normalise(input);
  if (!text) return { triggered: false, categories: [] };

  const categories: RedFlagCategory[] = [];
  for (const { category, patterns } of PATTERNS) {
    if (patterns.some((pattern) => pattern.test(text))) {
      categories.push(category);
    }
  }

  return { triggered: categories.length > 0, categories };
}

/** Scans several fields at once, de-duplicating categories. */
export function detectRedFlagsIn(values: (string | undefined)[]): RedFlagResult {
  const categories = new Set<RedFlagCategory>();
  for (const value of values) {
    if (!value) continue;
    for (const category of detectRedFlags(value).categories) {
      categories.add(category);
    }
  }
  return { triggered: categories.size > 0, categories: [...categories] };
}

/**
 * The message shown when a red flag fires. Deliberately a single, unambiguous
 * instruction — no booking prompt, no service suggestions, nothing that would
 * compete with "get emergency care".
 */
export function emergencyMessage(categories: RedFlagCategory[], clinicPhone: string): string {
  if (categories.includes("self-harm")) {
    return (
      "It sounds like you may be going through something serious, and this is not the right " +
      "place to get help with it. If you're thinking about harming yourself, please call or " +
      "text 988 (Suicide Crisis Helpline, available across Canada) or call 911 right now. " +
      "You can also reach the clinic at " +
      clinicPhone +
      " during opening hours, but please don't wait on us if you're in crisis."
    );
  }

  return (
    "What you're describing may need urgent medical attention, and it isn't something we can " +
    "safely handle through this website. Please call 911 or go to your nearest emergency " +
    "department now. If it turns out not to be an emergency, we're glad to help afterwards — " +
    "you can reach the clinic at " +
    clinicPhone +
    "."
  );
}
