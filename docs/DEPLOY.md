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
| `SUPABASE_URL` | No | The database holding the therapist list and clinic contact details. Without it the site serves the content bundled at build time. See [Editing content from the portal](#editing-content-from-the-portal). |
| `SUPABASE_ANON_KEY` | No | Read-only key the website uses. Required whenever `SUPABASE_URL` is set. |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Write key the staff portal saves with. Without it the portal is view-only. Never expose to the browser. |

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

The portal edits the **therapist list** (`/admin/team`) and the **clinic contact
information** (`/admin/clinic`). Services, blog posts, testimonials and page copy
are still edited in the repository.

**Changes appear on the website immediately.** There is no publish step and no
rebuild to wait for.

### Renaming the clinic

The clinic's name is one of the fields on `/admin/clinic`, and changing it
renames the whole site — page titles, search-result descriptions, the logo
wordmark, the social share image, and the structured data Google reads.

That works because page copy written in the repository marks the brand with a
`{brand}` placeholder (`lib/brand.ts`) instead of spelling the name out, and
every page fills it in from the database as it renders. When adding copy that
names the clinic, write `{brand}` rather than the name — a page that hardcodes
it will still say the old name after a rename.

The logo stacks the first word of the name over the rest, so "Kinetic
Physiotherapy" renders as KINETIC / Physiotherapy.

Two places keep a literal copy on purpose: `app/global-error.tsx`, the
last-resort error screen, which must not depend on anything that could itself
be the failure; and blog posts, whose bylines are part of the published
article.

### How it works

Those two things live in a Supabase (Postgres) database rather than in the repo.
The public pages are still statically generated for speed, and they read the
database through a cache tagged `site-content`. When the portal saves, it
invalidates that tag and the affected pages regenerate on the next request —
seconds, not minutes.

Everything else about the site is unchanged: services and blog posts still come
from `content/site-content.json` and `content/blog`, and every page still
prerenders.

### Setup

From the Supabase dashboard, **Project Settings → API**, copy three values into
Vercel:

| Vercel variable | Supabase field |
|---|---|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | `anon` / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` / secret key |

Set all three for **Production** *and* **Preview**, then redeploy — Vercel only
applies environment changes to new deployments.

The `service_role` key bypasses every access rule in the database. It is
server-side only and must never be given a `NEXT_PUBLIC_` name.

### What happens when the database is unavailable

Nothing on the public site breaks. Every read falls back to the copy of
`content/site-content.json` bundled at build time, so visitors see the last
known-good content rather than an error. The portal reports the problem and
disables saving until it recovers.

This matters because **Supabase pauses free-tier projects after about a week of
inactivity**. Two things guard against it:

- `/api/keepalive` runs daily via `vercel.json` and queries the database, which
  counts as activity. Its response also records whether the database answered,
  so an outage shows up in the Vercel cron log.
- The fallback above means a pause degrades the portal, never the website.

If the portal ever reports the database asleep, open the Supabase dashboard to
wake it. Upgrading to Supabase Pro removes the pausing behaviour entirely.

### Database schema

Three tables, created by migration:

| Table | Holds |
|---|---|
| `practitioners` | One row per therapist, ordered by `sort_order` |
| `clinic_info` | A single row of contact details, hours and trust badges |
| `content_change_log` | Every portal edit: who, what, when, and the before/after |

Row level security allows the `anon` key to **read** the two content tables and
nothing else. The change log is not readable through the public API at all — it
carries staff email addresses. All writes go through the `service_role` key from
the portal's server actions.

### Audit trail

Every save records who made it, what changed, and the values before and after.
The most recent entries appear on the portal dashboard; the full history is in
the `content_change_log` table.

### Safety properties

- The portal never writes raw form input. Validators return a fixed set of typed
  fields and the store maps exactly those onto columns, so a crafted post cannot
  reach a column the form doesn't expose — `needs_verification` in particular,
  which decides whether an unconfirmed credential is published.
- Removing a therapist, or editing one, preserves fields the forms don't show.
- Concurrent editors work on rows identified by database id, so a list that
  shifts underneath someone cannot cause them to overwrite the wrong record.
