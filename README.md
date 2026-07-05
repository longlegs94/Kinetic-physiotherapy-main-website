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
components/     layout · sections · cards · ui · motion · blog · analytics
content/        site-content.json · design-tokens.json · blog/*.mdx
lib/            site-data · seo · schema · motion · analytics · blog · utils
public/         static assets (add real images here)
docs/           DEPLOY.md · VERIFY_BEFORE_LAUNCH.md
```

## Deployment

See [`docs/DEPLOY.md`](docs/DEPLOY.md). Short version: import the repo into Vercel, set
`NEXT_PUBLIC_SITE_URL` (and optionally the Web3Forms + GA4 keys), deploy, then point your
domain's DNS. Your existing WordPress site stays live until you make that DNS change.

## Key features

- Sticky header + mobile nav sheet + sticky mobile booking bar
- Book Now (Jane) / click-to-call CTAs with GA4 event tracking
- Pain-point selector, multidisciplinary care diagram, ICBC process timeline
- 9 local-SEO service pages generated from data
- Per-page metadata, canonical URLs, LocalBusiness/Service/FAQ/Breadcrumb schema,
  auto sitemap + robots, generated OpenGraph image
- Accessible: semantic HTML, focus states, alt text, `prefers-reduced-motion` support
