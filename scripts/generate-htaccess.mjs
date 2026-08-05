#!/usr/bin/env node
/**
 * Writes `out/.htaccess` after a static export.
 *
 * On a Node deploy, Next serves the WordPress 301s and the security headers
 * itself (next.config.mjs). A static export is just files, so Apache has to do
 * that job instead — this script translates the same rules from
 * config/site-rules.mjs into Apache directives, plus the pieces Next's dev/
 * Node server handles implicitly:
 *
 *   - extensionless URLs (`/contact` → `contact.html`)
 *   - the 404 page
 *   - HTTPS + canonical-host redirects
 *   - long-lived caching for immutable `/_next/static` assets
 *   - gzip/brotli compression
 *
 * Run via `npm run build:static`. Safe to re-run; it overwrites.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import nextEnv from "@next/env";

import { securityHeaders, wordpressRedirects } from "../config/site-rules.mjs";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

// Same .env loading `next build` does, so the canonical host here matches the
// one baked into the HTML. Harmless when the vars are already in the
// environment (CI) — real env vars win over .env files.
nextEnv.loadEnvConfig(projectRoot, false);

// Where `output: "export"` writes the site. Next's default, unchanged here.
const OUT_DIR = join(projectRoot, "out");

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "");
const extraConnectSrc = apiBase ? [apiBase] : [];

/**
 * Canonical host, derived from the same env var that drives canonical <link>
 * tags and the sitemap, so Apache can't disagree with the HTML about which
 * hostname is the real one. Unset means "don't emit a host redirect" — safer
 * than guessing and locking the site to the wrong domain.
 */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
let canonicalHost = "";
if (siteUrl) {
  try {
    canonicalHost = new URL(siteUrl).host;
  } catch {
    console.warn(`[htaccess] NEXT_PUBLIC_SITE_URL is not a valid URL: ${siteUrl}`);
  }
}

/** Escapes a literal path so it can sit inside an Apache regex. */
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Apache header value: escape double quotes, and it must stay on one line. */
function quote(value) {
  return `"${String(value).replace(/"/g, '\\"').replace(/\s+/g, " ").trim()}"`;
}

const lines = [];
const push = (...l) => lines.push(...l);

push(
  "# ---------------------------------------------------------------------------",
  "# GENERATED FILE — do not edit directly.",
  "# Produced by scripts/generate-htaccess.mjs from config/site-rules.mjs.",
  "# Edit those, then re-run `npm run build:static`.",
  "# ---------------------------------------------------------------------------",
  ""
);

// --- MIME types -------------------------------------------------------------
// SiteGround's Apache knows the common ones, but the site ships .webmanifest
// and SVG assets that some stacks still serve as text/plain.
push(
  "<IfModule mod_mime.c>",
  "  AddType image/svg+xml            .svg",
  "  AddType application/manifest+json .webmanifest",
  "  AddType application/json         .json",
  "  AddType font/woff2               .woff2",
  "</IfModule>",
  ""
);

// --- Rewrites ---------------------------------------------------------------
// mod_dir would otherwise 301 /blog to /blog/ before the .html rewrite below
// gets a look at it, sending the request into a directory with no index.
push("<IfModule mod_dir.c>", "  DirectorySlash Off", "</IfModule>", "");

push("<IfModule mod_rewrite.c>", "  RewriteEngine On", "");

// Force HTTPS. SiteGround terminates SSL upstream, so %{HTTPS} can read "off"
// on a request that already arrived over TLS — check the forwarded header too,
// otherwise this rule can loop.
push(
  "  # Force HTTPS (X-Forwarded-Proto covers SiteGround's SSL termination).",
  "  RewriteCond %{HTTPS} !=on",
  "  RewriteCond %{HTTP:X-Forwarded-Proto} !https",
  "  RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]",
  ""
);

if (canonicalHost) {
  push(
    `  # Canonical host — everything else 301s to ${canonicalHost}.`,
    `  RewriteCond %{HTTP_HOST} !^${escapeRegex(canonicalHost)}$ [NC]`,
    "  RewriteCond %{HTTP_HOST} !^$",
    `  RewriteRule ^(.*)$ https://${canonicalHost}/$1 [R=301,L]`,
    ""
  );
}

// WordPress 301s. These run before the trailing-slash and .html rules so the
// old indexed URLs redirect in a single hop rather than a chain.
push("  # --- 301s from the old WordPress site (config/site-rules.mjs) ---");
for (const { source, destination } of wordpressRedirects) {
  const from = escapeRegex(source.replace(/^\//, ""));
  push(`  RewriteRule ^${from}/?$ ${destination} [R=301,L]`);
}
push("");

// Canonical URLs in the HTML are extensionless and slash-free, so make Apache
// agree. The condition is "no index.html inside" rather than "not a directory":
// /blog is BOTH blog.html and a blog/ directory holding the posts, and the
// directory must not win. If the export ever switches to trailingSlash:true,
// real index.html directories appear and this rule correctly stops firing.
push(
  "  # Strip trailing slashes to match the canonical URLs in the HTML.",
  "  RewriteCond %{REQUEST_FILENAME}/index.html !-f",
  "  RewriteRule ^(.+)/$ /$1 [R=301,L]",
  ""
);

// The export writes out/contact.html; visitors ask for /contact.
//
// Deliberately no `!-d` guard here. /blog and /locations are directories that
// also have a sibling .html — with `!-d` this rule would skip them, mod_dir
// would redirect /blog to /blog/, and the page would 404. Requiring the .html
// twin to exist is enough: directories without one fall through untouched.
push(
  "  # Serve /contact from contact.html (Next exports extensionless routes).",
  "  # Also catches /blog and /locations, which are files AND directories.",
  "  RewriteCond %{REQUEST_FILENAME} !-f",
  "  RewriteCond %{REQUEST_FILENAME}.html -f",
  "  RewriteRule ^(.+)$ $1.html [L]",
  ""
);

// Anything still resolving to a bare directory at this point has no page
// behind it (/blog and /locations already exited via the rule above). Without
// this, Apache answers with its stock 403 because indexes are off.
push(
  "  # Index-less directories get the branded 404, not Apache's 403.",
  "  RewriteCond %{REQUEST_FILENAME} -d",
  "  RewriteCond %{REQUEST_FILENAME}/index.html !-f",
  "  RewriteRule ^ - [R=404,L]",
  ""
);

// Tag hashed build output so the caching rules below can key off the path
// rather than the file extension.
push(
  "  # Marks immutable build assets for the Cache-Control rule below.",
  "  RewriteRule ^_next/static/ - [E=IMMUTABLE_ASSET:1]",
  ""
);

push("</IfModule>", "");

// --- 404 --------------------------------------------------------------------
push("# Next's exported not-found page.", "ErrorDocument 404 /404.html", "");

// --- Security headers -------------------------------------------------------
push(
  "# Mirrors the headers next.config.mjs sets on Node deploys.",
  "<IfModule mod_headers.c>"
);
for (const { key, value } of securityHeaders(extraConnectSrc)) {
  push(`  Header always set ${key} ${quote(value)}`);
}
push(
  "",
  "  # Content-hashed files under /_next/static never change — cache them hard.",
  '  Header set Cache-Control "public, max-age=31536000, immutable" env=IMMUTABLE_ASSET',
  "",
  "  # HTML and the .txt RSC payloads that drive client-side navigation must",
  "  # revalidate, or visitors keep seeing the previous deploy.",
  '  <FilesMatch "\\.(html|txt)$">',
  '    Header set Cache-Control "public, max-age=0, must-revalidate"',
  "  </FilesMatch>",
  "</IfModule>",
  ""
);

// Next writes the generated social image to an extensionless file named
// `opengraph-image`. Apache would hand that out as text/plain, and every
// scraper (Facebook, LinkedIn, iMessage, Google) would reject it.
push(
  "# The generated OG image has no file extension — force its real type.",
  '<Files "opengraph-image">',
  "  ForceType image/png",
  "</Files>",
  ""
);

// --- Compression ------------------------------------------------------------
push(
  "<IfModule mod_deflate.c>",
  "  AddOutputFilterByType DEFLATE text/html text/css text/plain text/xml",
  "  AddOutputFilterByType DEFLATE application/javascript application/json",
  "  AddOutputFilterByType DEFLATE image/svg+xml application/manifest+json",
  "</IfModule>",
  "",
  "<IfModule mod_brotli.c>",
  "  AddOutputFilterByType BROTLI_COMPRESS text/html text/css text/plain text/xml",
  "  AddOutputFilterByType BROTLI_COMPRESS application/javascript application/json",
  "  AddOutputFilterByType BROTLI_COMPRESS image/svg+xml application/manifest+json",
  "</IfModule>",
  ""
);

// --- Directory listing ------------------------------------------------------
push("Options -Indexes", "");

mkdirSync(OUT_DIR, { recursive: true });
const target = join(OUT_DIR, ".htaccess");
writeFileSync(target, lines.join("\n"), "utf8");

console.log(
  `[htaccess] wrote ${target} — ${wordpressRedirects.length} redirects, ` +
    `canonical host ${canonicalHost || "(not set — no host redirect emitted)"}`
);
