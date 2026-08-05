/**
 * Routing + security rules shared by every deploy target.
 *
 * Two things consume this file and they must never drift apart:
 *   - `next.config.mjs`            — Node/Vercel deploys, where Next itself
 *                                    serves the redirects and headers.
 *   - `scripts/generate-htaccess.mjs` — static SiteGround deploys, where
 *                                    Apache serves them from `out/.htaccess`.
 *
 * Plain `.mjs` (not TypeScript) so both a Next config and a bare `node`
 * script can import it without a build step.
 */

/**
 * 301 redirects from the old WordPress site (www.kineticphysio.ca) to the new
 * URLs, so pages already indexed by Google keep their ranking after cutover.
 * Sources are the paths Google had indexed; add more here if Search Console
 * later reports old URLs 404-ing. Next normalizes the old trailing slashes;
 * the generated Apache rules match an optional trailing slash themselves.
 */
export const wordpressRedirects = [
  // Structural pages
  { source: "/maple-ridge-physio-massage-chiro-kinesiology", destination: "/services" },
  { source: "/therapists", destination: "/team" },
  { source: "/maple-ridge-physio-contact", destination: "/contact" },
  { source: "/maple-ridge-physio-testimonials", destination: "/testimonials" },
  { source: "/gallery", destination: "/about" },
  { source: "/shop", destination: "/orthotics-bracing-maple-ridge" },
  { source: "/covid-19", destination: "/" },
  { source: "/category/injury", destination: "/blog" },
  // News / blog posts → closest relevant page (topical posts to their service)
  { source: "/we-are-growing-again", destination: "/about" },
  {
    source: "/preparing-for-surgery-the-power-of-prehabilitation-with-kinetic-physios-expert-advice",
    destination: "/physiotherapy-maple-ridge",
  },
  {
    source: "/revitalize-your-body-the-holistic-approach-of-massage-therapy-and-detoxification-for-optimal-wellness",
    destination: "/massage-therapy-maple-ridge",
  },
  {
    source: "/a-complete-guide-to-different-massage-techniques-and-their-benefits",
    destination: "/massage-therapy-maple-ridge",
  },
  { source: "/post-thanksgiving-recovery-chiropractic-care", destination: "/chiropractor-maple-ridge" },
  {
    source: "/unleash-the-injury-prevention-warrior-in-you-tips-exercises-and-support",
    destination: "/blog",
  },
  { source: "/mind-body-harmony-physiotherapy-kinetic", destination: "/blog" },
  {
    source: "/the-benefits-of-outdoor-workouts-in-november-embrace-the-fall-season",
    destination: "/blog",
  },
];

/** Next.js `redirects()` shape — `permanent: true` emits a 308 (a permanent 301 to search engines). */
export const nextRedirects = wordpressRedirects.map((r) => ({ ...r, permanent: true }));

/**
 * Content-Security-Policy for the site.
 *
 * - Fonts (Sora, Inter) are loaded via next/font/google, which self-hosts the
 *   font files at build time — no fonts.googleapis.com / fonts.gstatic.com
 *   entries are needed.
 * - Google Analytics 4 (components/analytics/Analytics.tsx) is loaded
 *   conditionally via next/script and needs googletagmanager.com (script) and
 *   google-analytics.com (script config + beacon/collect requests).
 * - The contact/intake/feedback forms reach Web3Forms two different ways
 *   depending on the deploy target: through the server relay at
 *   `/api/contact` on Node deploys, or straight from the browser to
 *   api.web3forms.com on static SiteGround deploys (see lib/submit-contact.ts).
 *   Either way only connect-src needs the Web3Forms origin — the forms use
 *   `fetch(...)`, not a native <form action> POST, so form-action stays 'self'.
 * - Next.js inline runtime/hydration scripts and inline JSON-LD
 *   (components/ui/JsonLd.tsx) require script-src 'unsafe-inline' (no nonce
 *   middleware in this project).
 * - Framer Motion applies animated styles inline, requiring style-src
 *   'unsafe-inline'.
 *
 * `extraConnectSrc` lets a static build that points the forms/concierge at an
 * off-site API (NEXT_PUBLIC_API_BASE_URL) whitelist that origin too.
 */
export function buildCsp(extraConnectSrc = []) {
  const connectSrc = [
    "'self'",
    "https://www.googletagmanager.com",
    "https://*.google-analytics.com",
    "https://api.web3forms.com",
    ...extraConnectSrc,
  ];

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://*.google-analytics.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.google-analytics.com",
    "font-src 'self' data:",
    `connect-src ${connectSrc.join(" ")}`,
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];
}

/**
 * Security headers applied to every response. Kept here so the Next config and
 * the generated .htaccess emit an identical set.
 *
 * Note: HSTS is only safe once the domain is fully on HTTPS. SiteGround issues
 * a free Let's Encrypt certificate, so this holds after you've enabled SSL for
 * the domain in Site Tools — do that before the DNS cutover.
 */
export function securityHeaders(extraConnectSrc = []) {
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "SAMEORIGIN" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=()",
    },
    { key: "Content-Security-Policy", value: buildCsp(extraConnectSrc).join("; ") },
  ];
}
