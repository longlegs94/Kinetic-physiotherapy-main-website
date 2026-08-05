#!/usr/bin/env node
/**
 * `npm run build:static` — produces the folder you upload to SiteGround.
 *
 * Wraps `next build` so that:
 *   - NEXT_PUBLIC_STATIC_EXPORT=1 is set for the whole build, which switches
 *     next.config.mjs to `output: "export"` and drops the API route handlers;
 *   - the .htaccess is generated straight afterwards, so `out/` is never
 *     shipped without its redirects and security headers.
 *
 * Written as a Node script rather than inline shell env vars so it behaves the
 * same on Windows, macOS, and Linux without pulling in cross-env.
 */

import { spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import nextEnv from "@next/env";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(scriptDir, "..");

// Load .env / .env.local / .env.production exactly the way `next build` does,
// so this script sees the same NEXT_PUBLIC_SITE_URL the build will bake in.
nextEnv.loadEnvConfig(projectRoot, false);

const env = { ...process.env, NEXT_PUBLIC_STATIC_EXPORT: "1" };

if (!env.NEXT_PUBLIC_SITE_URL) {
  console.warn(
    "\n[build:static] NEXT_PUBLIC_SITE_URL is not set.\n" +
      "  Canonical URLs, the sitemap, and the .htaccess host redirect all depend\n" +
      "  on it. Set it in .env.local (or the environment) before a real deploy.\n"
  );
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

// A stale out/ can leave deleted pages behind, which then get rsynced to the
// live site as orphans. Always start clean.
const outDir = join(projectRoot, "out");
if (existsSync(outDir)) {
  rmSync(outDir, { recursive: true, force: true });
}

run("npx", ["next", "build"]);
run("node", [join(scriptDir, "generate-htaccess.mjs")]);

console.log("\n[build:static] Done — upload the contents of out/ to public_html.\n");
