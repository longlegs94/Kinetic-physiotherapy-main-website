# Deploying to Vercel

This is a standard Next.js App Router project — Vercel is the easiest host, but any
Node host that runs `next build` / `next start` works.

## 1. Push the repo to GitHub
Push any branch. Merge to your default branch when ready to go live.

## 2. Vercel is already connected — no manual import needed
The repo is linked to the Vercel project **`kinetic-physiotherapy-main-website`**
(team: `longlegs94's projects`), framework preset **Next.js**, Node 24.x. The Git
integration builds *every pushed branch* automatically:

- **Any branch push** → a preview deployment at a generated `*.vercel.app` URL.
- **Default branch push** → the production deployment.

So the deploy step is just `git push`. Only add environment variables (below) when
you need the features they gate — the build succeeds without them.

### Don't convert this app to a static export
Vercel is the deploy target, and this app is deliberately a **Node** app: the
contact, intake, and concierge endpoints are real App Router handlers under
`app/api/*/route.ts`. Keep them named `route.ts`.

Renaming them (e.g. `route.ts` → `route.node.ts`) to force a static export breaks
the Vercel build. Next.js stops emitting the per-route client-reference manifest
that Vercel's builder expects when collecting output, and the build fails with:

```
Error: ENOENT ... .next/server/app/api/<name>/route_client-reference-manifest.js
```

The failure lands *after* "Collecting build traces" — long past
`✓ Compiled successfully` — so the log reads healthy right up to the last line.
If you ever see that error, the cause is a renamed route handler, not the Vercel
project.

## 3. Environment variables
Set these in **Vercel → Project → Settings → Environment Variables** (see `.env.example`):

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Yes | Production URL, no trailing slash (e.g. `https://www.kinetictherapyclinic.ca`). Drives canonical URLs, sitemap, and schema. |
| `NEXT_PUBLIC_JANE_BOOKING_URL` | No | Overrides the Jane URL in content if set. |
| `WEB3FORMS_KEY` | No | Free key from <https://web3forms.com>, read server-side by `app/api/contact/route.ts`. Preferred over `NEXT_PUBLIC_WEB3FORMS_KEY` — it's never exposed to the browser. Without either set, the relay returns 501 and the contact/intake forms fall back to opening the visitor's email app. |
| `NEXT_PUBLIC_WEB3FORMS_KEY` | No | Legacy client-side fallback for the same key. Only kept so existing deployments that set this continue to work; new setups should use `WEB3FORMS_KEY` instead. |
| `NEXT_PUBLIC_GA_ID` | No | Google Analytics 4 Measurement ID (`G-XXXXXXXXXX`). Without it, analytics is disabled. |
| `OPENAI_API_KEY` | No | Enables the AI booking concierge, the symptom router, and the intake summarizer. Server-side only. Without it, all three show contact options instead. |
| `NEXT_PUBLIC_AI_ASSISTANT_ENABLED` | No | Master on/off switch for every AI surface. Blank or `1`/`true`/`on` keeps it running; `0`/`false`/`off` hides all AI UI and makes the API refuse requests, so no spend is possible while off. Takes effect on the next deploy. |
| `CONCIERGE_MODEL` | No | Model shared by the concierge and the intake summarizer; defaults to gpt-5.4-mini. Set gpt-5.4-nano for lower cost — see the tradeoff noted in `.env.example`. |
| `ADMIN_USERS` | No | Staff portal accounts as `email:hash` entries. Blank keeps `/admin` switched off. See [The staff portal](#the-staff-portal) below. |
| `ADMIN_SESSION_SECRET` | No | Signs the admin session cookie; at least 32 characters. Required whenever `ADMIN_USERS` is set. |
| `CONTENT_GITHUB_TOKEN` | No | Lets the portal save therapist and clinic edits by committing to the repo. Without it the portal is view-only. See [Editing content from the portal](#editing-content-from-the-portal). |
| `CONTENT_GITHUB_REPO` | No | `owner/repo` the portal commits to. Required whenever `CONTENT_GITHUB_TOKEN` is set. |
| `CONTENT_GITHUB_BRANCH` | No | Branch to read and commit (default `main`). |

After changing env vars, redeploy so they take effect.

## The staff portal

`/admin` is a small password-protected area for clinic staff. It ships switched
off: with `ADMIN_USERS` blank there is no account that can sign in, and nothing
on the public site depends on it.

To turn it on:

1. **Generate a signing secret** and set it as `ADMIN_SESSION_SECRET`:
   ```bash
   openssl rand -base64 48
   ```
2. **Generate an entry per person.** The script prompts for the password (it is
   never passed as an argument, so it stays out of shell history) and prints the
   line to paste:
   ```bash
   npm run admin:hash -- someone@kinetictherapyclinic.ca
   ```
3. **Set `ADMIN_USERS`** to those lines, separated by newlines, commas or
   semicolons. Only hashes go in here — never a plaintext password, since a
   Vercel environment variable is readable by everyone with project access.
4. **Redeploy.** Both variables are read at request time, but Vercel only
   applies environment changes to new deployments.

Setting one variable without the other **fails the production build** on
purpose (`scripts/check-env.ts`): accounts with no secret reject every correct
password, and a secret with no accounts leaves nobody able to sign in — both
look like a forgotten password rather than a missing setting.

**Revoking access.** Sessions last 8 hours and are stateless, so there is no
session table to clear. Instead:

| To sign out… | Do this |
|---|---|
| One person | Remove their entry from `ADMIN_USERS`, or re-run `admin:hash` to replace their hash |
| Everyone, immediately | Rotate `ADMIN_SESSION_SECRET` |

Both take effect on the next request after the redeploy — a cookie issued
against a removed account or a changed password stops verifying.

`/admin` is `Disallow`ed in `robots.ts` and served `noindex`, and `proxy.ts`
redirects signed-out visitors to `/admin/login` before any portal page renders.

## Editing content from the portal

The portal can edit the **therapist list** (`/admin/team`) and the **clinic
contact information** (`/admin/clinic`). Services, blog posts, testimonials and
page copy are still edited in the repository.

There is no database, so saving means committing `content/site-content.json`
back to the repo, which triggers a Vercel rebuild. An edit is live in about a
minute, every change lands in git history as an audit trail, and the
`needsVerification` build gate keeps working because it still runs over the
real content file.

**Setup.** Create a **fine-grained** personal access token at
<https://github.com/settings/personal-access-tokens> :

1. **Repository access** → *Only select repositories* → this repo alone.
2. **Repository permissions** → **Contents: Read and write**. Nothing else.
3. Set `CONTENT_GITHUB_TOKEN` to the token and `CONTENT_GITHUB_REPO` to
   `owner/repo`, then redeploy.

Without both, the portal degrades to a viewer — the screens still show what the
site currently says, with a "view only" notice in place of the Save buttons.
Setting one without the other **fails the production build** on purpose, since
a portal with working-looking Save buttons that fail on click reads as broken
rather than unconfigured.

**Security note.** The token is exactly as powerful as the admin password that
reaches it: anyone who can sign in to the portal can change what
`content/site-content.json` contains. The scoping above is what bounds the
damage — contents-only, one repo, no ability to touch workflows, secrets or
settings. The portal itself never writes JSON a user supplied: it applies
narrowly-typed field-by-field mutations to the parsed file
(`lib/admin/content-schema.ts`), so a crafted form post cannot introduce new
keys or overwrite unrelated sections.

**Concurrency.** Each save is committed against the file SHA the edit was based
on, so two people editing at once produce a visible "someone else changed this,
reload" message rather than one silently overwriting the other.

**If a save seems not to appear:** check the Vercel deployment. A rebuild that
fails leaves the commit in place but the site on the previous version.

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

## Monitoring
- Enable Vercel's built-in **Error/Runtime Monitoring** and **Web Analytics**
  from the project dashboard (Vercel → Project → Analytics / Observability) —
  no code changes needed, just a toggle per project.
- GA4 conversion events already fire from the app (see `lib/analytics.ts`)
  for booking clicks, phone clicks, and contact/intake form submissions —
  they'll show up automatically in GA4 once `NEXT_PUBLIC_GA_ID` is set.

## URL migration (WordPress → new site) — DONE

301 redirects for the old `www.kineticphysio.ca` pages are already built into
`next.config.mjs` (`wordpressRedirects`). They were mapped from the URLs Google had
indexed, so ranking is preserved after cutover. Examples:

| Old URL | New URL |
|---|---|
| `/therapists/` | `/team` |
| `/maple-ridge-physio-massage-chiro-kinesiology/` | `/services` |
| `/maple-ridge-physio-contact/` | `/contact` |
| `/maple-ridge-physio-testimonials/` | `/testimonials` |
| `/gallery/` | `/about` |
| `/shop/` | `/orthotics-bracing-maple-ridge` |
| Massage blog posts | `/massage-therapy-maple-ridge` |
| Chiropractic blog post | `/chiropractor-maple-ridge` |
| Other old blog posts | `/blog` |

All verified to resolve to a live page (200). Old trailing-slash URLs normalize first,
so they land via a short 308 chain — search engines follow this fine.

**After cutover:** open Google Search Console → Coverage/Pages and watch for any old URL
reporting 404. If one appears that isn't in the map, add a line to `wordpressRedirects`
in `next.config.mjs` and redeploy.

## Local development
```bash
npm install
cp .env.example .env.local   # fill in values (all optional for local dev)
npm run dev                  # http://localhost:3000
npm run build && npm run start   # production preview
```
