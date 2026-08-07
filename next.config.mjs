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
 * Why `script-src` still carries 'unsafe-inline': every page here is
 * statically prerendered, so its scripts are baked at build time. A nonce is
 * minted per request and would therefore match nothing in the prerendered
 * HTML — under 'strict-dynamic' that blocks both Next's inline hydration
 * bootstrap and its external chunks, and the site renders but never hydrates.
 * Escaping that requires per-request rendering of all 35 pages, which was
 * weighed and declined: this site renders no user-generated content, and the
 * realistic injection path (unescaped values inside the JSON-LD block) is
 * closed in components/ui/JsonLd.tsx. Revisit if untrusted content is ever
 * rendered — patient reviews posted to the site, comments, anything similar.
 *
 * Everything that does not depend on inline scripts is tightened as far as
 * the app actually allows:
 * - No iframes, <embed>, <object> or <base> anywhere in the app, so
 *   frame-src, object-src and base-uri are 'none' rather than 'self'.
 * - frame-ancestors 'none' (with a matching X-Frame-Options: DENY) since
 *   nothing frames this site, including itself.
 * - GA4's script comes only from googletagmanager.com, so
 *   *.google-analytics.com is dropped from script-src; it stays in
 *   connect-src and img-src, where GA4's region-specific collect endpoints
 *   and pixel beacons genuinely need it.
 *
 * Fonts (Sora, Inter) load via next/font/google, which self-hosts the files
 * at build time, so no Google Fonts origins appear. The contact and intake
 * forms reach Web3Forms via fetch() rather than a native form POST, so the
 * origin belongs in connect-src and form-action can stay 'self'. Framer
 * Motion writes animated styles inline on every frame, which cannot be
 * nonced or hashed — style injection is a far weaker primitive than script
 * injection, so style-src keeps 'unsafe-inline'.
 */
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://www.googletagmanager.com https://*.google-analytics.com",
  "font-src 'self' data:",
  "connect-src 'self' https://www.googletagmanager.com https://*.google-analytics.com https://api.web3forms.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "media-src 'self'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
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
          // Matches frame-ancestors 'none' above, for browsers that predate
          // CSP frame-ancestors support.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // `preload` is deliberately omitted: submitting to the HSTS preload
          // list is effectively irreversible and is the site owner's decision,
          // not a default to inherit.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          // Isolates the browsing context from anything the site opens or
          // embeds, and stops other origins loading this site's resources.
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          { key: "Content-Security-Policy", value: cspDirectives.join("; ") },
        ],
      },
    ];
  },
};

export default nextConfig;
