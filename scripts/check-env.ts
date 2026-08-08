/**
 * Build-time configuration gate. Runs as `prebuild`, so `npm run build` fails
 * before producing an artifact whose pages would render placeholder content.
 *
 * Only enforced for production builds. Local `next dev` and preview builds
 * (VERCEL_ENV=preview) stay unblocked so contributors can run the site without
 * a full environment; those surface the same problems as warnings instead.
 */
import { collectEnvProblems } from "../lib/env";
import { collectUnverifiedContent } from "../lib/verification";

const isProduction =
  process.env.VERCEL_ENV === "production" ||
  (process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === undefined);

const problems = collectEnvProblems(process.env);
const unverified = collectUnverifiedContent();

// Content still flagged needsVerification is only fatal when the owner has
// explicitly opted into the stricter gate, since clearing every flag needs
// the clinic to confirm real-world facts (hours, pricing, credentials).
const enforceContentGate = process.env.REQUIRE_VERIFIED_CONTENT === "1";

if (problems.length === 0 && unverified.length === 0) {
  console.log("check-env: configuration OK");
  process.exit(0);
}

const lines: string[] = [];

for (const { variable, problem } of problems) {
  lines.push(`  - ${variable} ${problem}`);
}

if (unverified.length > 0) {
  lines.push(
    `  - ${unverified.length} content entries still flagged needsVerification (hidden from production):`
  );
  for (const path of unverified.slice(0, 10)) {
    lines.push(`      ${path}`);
  }
  if (unverified.length > 10) {
    lines.push(`      …and ${unverified.length - 10} more`);
  }
}

const fatal = (isProduction && problems.length > 0) || (enforceContentGate && unverified.length > 0);

if (fatal) {
  console.error("check-env: production build blocked\n" + lines.join("\n"));
  process.exit(1);
}

console.warn("check-env: configuration warnings\n" + lines.join("\n"));
process.exit(0);
