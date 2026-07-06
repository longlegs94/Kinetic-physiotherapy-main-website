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
        ],
      },
    ];
  },
};

export default nextConfig;
