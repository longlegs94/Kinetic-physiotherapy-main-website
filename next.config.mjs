import { nextRedirects, securityHeaders } from "./config/site-rules.mjs";

/**
 * The site builds for two targets from one codebase:
 *
 *   1. **Node** (`npm run build`) — Vercel or any host that runs `next start`.
 *      Next serves the redirects and security headers, and the API route
 *      handlers under `app/api/**` are live (contact relay, intake summary,
 *      AI concierge).
 *
 *   2. **Static** (`npm run build:static`) — a plain folder of HTML/CSS/JS in
 *      `out/`, uploaded to SiteGround's `public_html`. Apache serves the
 *      redirects and headers from a generated `.htaccess`
 *      (scripts/generate-htaccess.mjs), and the API routes are excluded from
 *      the build because Apache can't run them.
 *
 * Everything the two targets must agree on lives in `config/site-rules.mjs`.
 */
const isStaticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";

/**
 * A static build has no server of its own, but the forms and concierge can
 * still reach API routes hosted elsewhere if NEXT_PUBLIC_API_BASE_URL points
 * at them. That cross-origin call has to be allowed by connect-src.
 */
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "");
const extraConnectSrc = apiBase ? [apiBase] : [];

/**
 * Route handlers are named `route.node.ts` rather than `route.ts` so that a
 * static export can drop them simply by not listing `node.ts` as a page
 * extension. Next matches the suffix after `route.`, so `node.ts` files are
 * invisible to the router unless the extension is explicitly enabled.
 *
 * Static export would otherwise fail outright: `output: "export"` cannot build
 * POST handlers or `dynamic = "force-dynamic"` routes.
 */
const defaultPageExtensions = ["js", "jsx", "ts", "tsx"];
const pageExtensions = isStaticExport
  ? defaultPageExtensions
  : ["node.ts", ...defaultPageExtensions];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  pageExtensions,
  images: isStaticExport
    ? // No image optimizer exists on static hosting. The site only ships SVGs
      // today, but this keeps a future next/image from breaking the export.
      { unoptimized: true }
    : { formats: ["image/avif", "image/webp"] },

  ...(isStaticExport
    ? {
        output: "export",
        // Emit out/contact.html rather than out/contact/index.html, and keep
        // canonical URLs extensionless. The generated .htaccess maps the two.
        trailingSlash: false,
      }
    : {
        async redirects() {
          return nextRedirects;
        },
        async headers() {
          return [{ source: "/(.*)", headers: securityHeaders(extraConnectSrc) }];
        },
      }),
};

export default nextConfig;
