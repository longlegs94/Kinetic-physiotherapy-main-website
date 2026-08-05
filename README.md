# Kinetic Therapy Clinic — Website

Premium, fast, SEO-friendly website for **Kinetic Therapy Clinic** in Maple Ridge, BC.
A multidisciplinary clinic offering physiotherapy, massage therapy, chiropractic,
kinesiology, acupuncture, ICBC/WSBC support, and recovery-focused care.

Built to replace the previous WordPress site with something faster, more reliable, and
easier to rank — static/server rendering, native metadata + JSON-LD schema, and
image optimization out of the box.

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** (design tokens from `content/design-tokens.json`)
- **Framer Motion** (reduced-motion safe)
- **MDX** blog via `next-mdx-remote`
- **lucide-react** icons
- JSON-driven content — no CMS required

## Quick start

```bash
npm install
cp .env.example .env.local   # optional for local dev
npm run dev                  # http://localhost:3000
```

Scripts: `npm run build`, `npm run start`, `npm run typecheck`, `npm run lint`.
For SiteGround: `npm run build:static`, `npm run preview:static`,
`npm run deploy:siteground`.

## Editing content (no code required)

Almost everything the clinic shows lives in **`content/site-content.json`**:

- **Clinic info** — address, phone, email, hours, Jane booking URL, trust badges
- **Services** — each service's copy, conditions, process, FAQs, related links, CTA
- **Practitioners** — name, title, bio, specialties, schedule, ICBC flag, photo
- **Testimonials** and **FAQs**

To edit a service: find it by `slug`, change the text, save, commit, deploy.
Colors/typography live in **`content/design-tokens.json`** (mirror color changes into
`tailwind.config.ts`).

Blog posts are MDX files in **`content/blog/`** — set `draft: false` to publish.
See `content/blog/README.md`.

> **Accuracy:** items marked `needsVerification` in the JSON must be confirmed before
> launch. Never guarantee medical outcomes or insurance coverage. See
> [`docs/VERIFY_BEFORE_LAUNCH.md`](docs/VERIFY_BEFORE_LAUNCH.md).

## Project structure

```
app/            Routes (home, [slug] service pages, team, about, contact,
                testimonials, blog, legal, sitemap/robots/OG)
                api/*/route.node.ts — server-only handlers, excluded from
                static builds (see config/site-rules.mjs)
components/     layout · sections · cards · ui · motion · blog · analytics
config/         site-rules.mjs — redirects + CSP shared by both deploy targets
content/        site-content.json · design-tokens.json · blog/*.mdx
lib/            site-data · seo · schema · motion · analytics · blog · utils
                deploy-target · submit-contact (target-aware form delivery)
scripts/        build-static · generate-htaccess · deploy-siteground.sh
public/         static assets (add real images here)
docs/           DEPLOY.md · DEPLOY_SITEGROUND.md · VERIFY_BEFORE_LAUNCH.md
```

## Deployment

The site builds for two targets from one codebase. Pick the one matching your host:

| Host | Guide | Build |
|---|---|---|
| **SiteGround** (or any shared/cPanel host) | [`docs/DEPLOY_SITEGROUND.md`](docs/DEPLOY_SITEGROUND.md) | `npm run build:static` → upload `out/` to `public_html` |
| **Vercel** (or any Node host) | [`docs/DEPLOY.md`](docs/DEPLOY.md) | `npm run build` → `npm start` |

Short version either way: set `NEXT_PUBLIC_SITE_URL` (and optionally the Web3Forms
+ GA4 keys), build, deploy, then point your domain's DNS. Your existing WordPress
site stays live until you make that DNS change.

The static build is a plain folder of files — no server to keep running. Everything
works there except the three AI-backed extras (booking concierge, symptom router,
AI intake summary), which degrade to call/book options; the forms still deliver.
`docs/DEPLOY_SITEGROUND.md` has the full comparison and how to keep them if you want.

Routing and security rules shared by both targets live in **`config/site-rules.mjs`**
— the old-WordPress 301s, the CSP, and the security headers. Edit them there and
both `next.config.mjs` and the generated `.htaccess` pick them up.

## Key features

- Sticky header + mobile nav sheet + sticky mobile booking bar
- Book Now (Jane) / click-to-call CTAs with GA4 event tracking
- Pain-point selector, multidisciplinary care diagram, ICBC process timeline
- 9 local-SEO service pages generated from data
- Per-page metadata, canonical URLs, LocalBusiness/Service/FAQ/Breadcrumb schema,
  auto sitemap + robots, generated OpenGraph image
- Accessible: semantic HTML, focus states, alt text, `prefers-reduced-motion` support
