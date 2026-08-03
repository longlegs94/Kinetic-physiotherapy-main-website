/**
 * 301 redirects from the old WordPress site (www.kineticphysio.ca) to the new
 * URLs, so pages already indexed by Google keep their ranking after cutover.
 * Sources are the paths Google had indexed; add more here if Search Console
 * later reports old URLs 404-ing. Next normalizes the old trailing slashes.
 * `permanent: true` emits a 308 (treated as a permanent 301 by search engines).
 */
const wordpressRedirects = [
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
].map((r) => ({ ...r, permanent: true }));

/**
 * Content-Security-Policy for the site.
 *
 * - Fonts (Sora, Inter) are loaded via next/font/google, which self-hosts the
 *   font files at build time — no fonts.googleapis.com / fonts.gstatic.com
 *   entries are needed.
 * - Google Analytics 4 (components/analytics/Analytics.tsx) is loaded
 *   conditionally via next/script and needs googletagmanager.com (script) and
 *   google-analytics.com (script config + beacon/collect requests).
 * - The contact and intake forms (components/cards/ContactForm.tsx,
 *   components/intake/IntakeForm.tsx) submit to Web3Forms via `fetch(...)`,
 *   not a native <form action> POST, so only connect-src needs the Web3Forms
 *   origin — form-action can stay 'self'.
 * - Next.js inline runtime/hydration scripts and inline JSON-LD
 *   (components/ui/JsonLd.tsx) require script-src 'unsafe-inline' (no nonce
 *   middleware in this project).
 * - Framer Motion applies animated styles inline, requiring style-src
 *   'unsafe-inline'.
 */
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://*.google-analytics.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.google-analytics.com",
  "font-src 'self' data:",
  "connect-src 'self' https://www.googletagmanager.com https://*.google-analytics.com https://api.web3forms.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return wordpressRedirects;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          { key: "Content-Security-Policy", value: cspDirectives.join("; ") },
        ],
      },
      {
        // Static assets served straight from /public — unlike /_next/static/*,
        // Next doesn't auto-add long-lived caching to these on its own.
        source: "/:path*.(svg|png|jpg|jpeg|webp|avif|ico)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
