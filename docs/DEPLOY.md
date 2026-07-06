# Deploying to Vercel

This is a standard Next.js App Router project — Vercel is the easiest host, but any
Node host that runs `next build` / `next start` works.

## 1. Push the repo to GitHub
Already on the branch `claude/website-redesign-migration-dupdzl`. Merge to your default
branch when ready.

## 2. Import into Vercel
1. Go to <https://vercel.com/new> and import the GitHub repo.
2. Framework preset: **Next.js** (auto-detected). No build settings changes needed.
3. Add the environment variables below, then **Deploy**.

## 3. Environment variables
Set these in **Vercel → Project → Settings → Environment Variables** (see `.env.example`):

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Yes | Production URL, no trailing slash (e.g. `https://www.kinetictherapyclinic.ca`). Drives canonical URLs, sitemap, and schema. |
| `NEXT_PUBLIC_JANE_BOOKING_URL` | No | Overrides the Jane URL in content if set. |
| `NEXT_PUBLIC_WEB3FORMS_KEY` | No | Free key from <https://web3forms.com>. Without it, the contact form falls back to opening the visitor's email app. |
| `NEXT_PUBLIC_GA_ID` | No | Google Analytics 4 Measurement ID (`G-XXXXXXXXXX`). Without it, analytics is disabled. |
| `ANTHROPIC_API_KEY` | No | Enables the AI booking concierge chat. Server-side only. Without it the widget shows contact options instead. |
| `CONCIERGE_MODEL` | No | Model for the concierge; defaults to claude-opus-4-8. Set claude-haiku-4-5 for lower cost. |

After changing env vars, redeploy so they take effect.

## 4. Point your domain (DNS cutover)
Your live WordPress site is untouched until you do this step.
1. In Vercel → Project → **Domains**, add your domain (e.g. `kinetictherapyclinic.ca`).
2. Update DNS at your registrar to the records Vercel shows (usually an `A` record to
   Vercel's IP and/or a `CNAME` for `www`).
3. Vercel provisions SSL automatically. Verify HTTPS works, then you're live.

## 5. Post-launch
- Submit `https://<your-domain>/sitemap.xml` in Google Search Console.
- If migrating from WordPress, set up 301 redirects from old URLs to the new
  Maple-Ridge-focused URLs to preserve SEO (see `docs/URL-MIGRATION` note below).
- Confirm the contact form delivers to the clinic inbox.

## URL migration (WordPress → new site)
The new service URLs are local-SEO focused (e.g. `/physiotherapy-maple-ridge`). If your
old WordPress pages used different paths, add redirects in `next.config.mjs`:

```js
async redirects() {
  return [
    { source: "/old-physio-path", destination: "/physiotherapy-maple-ridge", permanent: true },
    // ...one per changed URL
  ];
}
```

List your current WordPress URLs and we can generate the full redirect map.

## Local development
```bash
npm install
cp .env.example .env.local   # fill in values (all optional for local dev)
npm run dev                  # http://localhost:3000
npm run build && npm run start   # production preview
```
