#!/usr/bin/env node
// Non-blocking pre-build check: flags content still marked `needsVerification`
// (see docs/VERIFY_BEFORE_LAUNCH.md) so it isn't shipped unnoticed.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const contentPath = path.join(here, "..", "content", "site-content.json");
const data = JSON.parse(readFileSync(contentPath, "utf8"));

const flagged = [];

function walk(node, trail) {
  if (Array.isArray(node)) {
    node.forEach((item, i) => walk(item, `${trail}[${i}]`));
    return;
  }
  if (node && typeof node === "object") {
    if (node.needsVerification === true) {
      const label = node.label ?? node.name ?? node.days ?? node.question ?? trail;
      flagged.push(`${trail} (${label})`);
    }
    for (const [key, value] of Object.entries(node)) {
      if (key === "needsVerification") continue;
      walk(value, `${trail}.${key}`);
    }
  }
}

walk(data, "site-content.json");

if (flagged.length > 0) {
  console.warn(
    `\n⚠️  ${flagged.length} item(s) in content/site-content.json are still marked needsVerification:\n` +
      flagged.map((f) => `   - ${f}`).join("\n") +
      "\n   See docs/VERIFY_BEFORE_LAUNCH.md before this goes live.\n"
  );
} else {
  console.log("✓ No unverified content flagged in content/site-content.json.");
}
