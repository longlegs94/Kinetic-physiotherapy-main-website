# Phase 1 Backlog — Launch & Fill the Funnel (Months 0–3)

Companion to `ROADMAP.md` §4 Phase 1. Every ticket has an owner:
- **DEV** — buildable in this repo now (no input needed).
- **OWNER** — only the clinic owner can do it (accounts, photos, approvals).
- **BOTH** — owner provides input, dev wires it in.

Effort: **S** ≤ half a day · **M** 1–2 days · **L** 3+ days.

---

## Epic A — Launch blockers

### A1 · Wire real photos into the site — `BOTH` · M · 🚫 blocked on owner
Owner uploads photos (team portraits, reception, treatment rooms, exterior — see
`VERIFY_BEFORE_LAUNCH.md` "Assets" for the shot list). Dev optimizes (next/image,
AVIF/WebP, correct `sizes`), places into hero, ClinicExperience, practitioner cards,
and contact page, and removes every `TODO(assets)` comment.
**Accept:** no illustration placeholders remain on homepage/team/contact; LCP image
preloaded; Lighthouse performance stays ≥ 90 mobile.

### A2 · Confirm and apply the final roster — `BOTH` · S · 🚫 blocked on owner
Owner confirms the 9 listed practitioners, resolves the two publicly-found names
(Jessica Berta, Preeti — add or ignore), and confirms the Aishwariya/"Ash" match.
Dev applies to `site-content.json`, clears `needsVerification` flags.
**Accept:** zero practitioners flagged `needsVerification`; every card has a real bio.

### A3 · Legal sign-off on Privacy Policy & Terms — `BOTH` · S · 🚫 blocked on owner
Owner gets lawyer review of the drafted pages. Dev applies edits and removes the
"working draft" banners.
**Accept:** draft disclaimers removed; policy names every live data flow.

### A4 · Production environment + DNS cutover — `BOTH` · M
Owner: Vercel account, domain access, env values (`ANTHROPIC_API_KEY`,
`WEB3FORMS_KEY`, `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_SITE_URL`, Jane URL).
Dev: verify deploy, run the post-cutover checklist — all 301s from old WordPress URLs
resolve, sitemap live, forms deliver, concierge answers, booking opens Jane.
**Accept:** production domain serves the new site; every row of the old-URL redirect
map returns 308→200; a test contact + intake submission lands in the clinic inbox.

### A5 · Search Console & indexing — `BOTH` · S · depends A4
Owner grants GSC access (or dev sets up with owner's Google account). Submit sitemap,
request indexing of the 9 service pages, monitor coverage + 404s weekly for the first
month; confirm FAQ/LocalBusiness rich results are recognized.
**Accept:** all key pages indexed; zero unexpected 404s in GSC after week 2.

---

## Epic B — Google review flywheel

### B1 · Build `/review` funnel page — `DEV` · S · buildable now
One clean page: "How was your visit?" with two equal options — leave a Google review
(deep link with the clinic's place ID) or send private feedback (posts to
`/api/contact` with `formName: "feedback"`). Both options always visible —
**no review gating** (Google policy prohibits routing only happy patients to Google).
Short URL for use in SMS/email/QR.
**Accept:** page live, both paths tested, GA4 events on both clicks.

### B2 · Post-visit review request templates + Jane setup guide — `BOTH` · S
Dev writes the email/SMS copy (compliant: invites feedback, doesn't incentivize or
gate) and a step-by-step guide for configuring Jane's post-appointment notifications
to send it with the `/review` link. Owner enables it in Jane.
**Accept:** templates in `docs/REVIEW_CAMPAIGN.md`; owner confirms first automated
send; target +15 Google reviews/month tracked monthly.

### B3 · GBP optimization checklist — `DEV` doc · `OWNER` execution · S
Categories, all 9 services listed, hours, photos (reuses A1 assets), Q&A seeding,
weekly post cadence with a 12-week post calendar drafted by dev.
**Accept:** checklist doc committed; owner completes profile to 100%.

### B4 · Review CTAs on the site — `DEV` · S · buildable now
Add a "Loved your visit? Review us" link to the contact-form success state and the
site footer. ⚠️ Do **not** add patient testimonials to ads or quote reviews in
marketing without college compliance review (CPTBC/CMTBC rules).
**Accept:** CTAs render, link to `/review`, GA4 event fires.

---

## Epic C — Local SEO expansion

### C1 · Location landing pages ×4 — `DEV` · L · buildable now
Template + pages for Pitt Meadows, Albion, Silver Valley, Websters Corners. Each must
be genuinely useful, not a doorway page: driving directions/time from that area,
which services those residents most commonly book, ICBC note, parking, embedded
practitioner preview, unique intro copy, `areaServed` schema, breadcrumbs, and
internal links to/from service pages. Added to sitemap + nav footer.
**Accept:** 4 pages statically generated, unique H1/title/meta, Lighthouse SEO 100,
no duplicated body copy between pages.

### C2 · Publish remaining 7 blog drafts on a weekly cadence — `BOTH` · M
Owner (or delegate) medically reviews each draft; dev polishes to the standard of the
3 launch posts (accuracy rules, internal links, CTA) and flips `draft: false` one per
week. Dev maintains a publish schedule table in the doc.
**Accept:** 10/10 posts live by end of month 3, each with a booking CTA and at least
2 internal links.

### C3 · Internal-linking + related-content pass — `DEV` · S · buildable now
"Related reading" module on service pages (relevant blog posts), "Related services"
links inside blog posts, location pages cross-linked. One systematic pass, not ad hoc.
**Accept:** every service page links ≥1 post; every post links ≥1 service; crawl
(e.g. Screaming Frog or a link-check script) shows no orphan pages.

### C4 · Post-launch rich-results & schema audit — `DEV` · S · depends A4, A5
Validate LocalBusiness, Service, FAQ, Breadcrumb, Article schema in Google's Rich
Results Test on production; fix warnings; confirm FAQ rich results appear in GSC
enhancement reports.
**Accept:** zero schema errors on production URLs.

---

## Epic D — ICBC paid search

### D1 · Conversion-optimized ICBC ads landing experience — `DEV` · M · buildable now
Tune `/icbc-physio-maple-ridge` for paid traffic (or add an ads variant): phone-first
sticky CTA on mobile, callback form above the fold, "what happens next" 3-step strip,
claim-number field on the callback form, zero nav distractions option via
`?utm_medium=cpc` styling. Copy stays compliance-safe ("up to 12 weeks, conditions
and eligibility apply" — no guarantees).
**Accept:** page variant live; callback form submits with claim context; all CTAs
fire distinct GA4 events.

### D2 · Ads conversion wiring — `BOTH` · S · depends A4
Define primary conversions (booking-start click, callback submit, click-to-call),
link GA4 ↔ Google Ads, import conversions. Owner creates/grants the Google Ads
account access.
**Accept:** test conversions visible in Google Ads within 24h.

### D3 · Campaign blueprint — `DEV` doc · `OWNER` budget approval · S
`docs/ICBC_ADS.md`: exact-match keyword set + negatives, 3 compliant ad variants,
geo-targeting (Maple Ridge/Pitt Meadows + radius), $1–1.5k/mo cap, and the kill/scale
rule: CAC < $60 per booked new patient scales, > $100 pauses.
**Accept:** doc committed; owner approves budget; campaign launches within 2 weeks
of A4.

---

## Epic E — Measurement

### E1 · Attribution rules + UTM conventions — `DEV` · S · buildable now
One page in `docs/ANALYTICS.md`: what counts as a "site-attributed booking," UTM
naming for every channel (GBP, ads, email, review page), and the monthly reporting
definition — agreed once so numbers are never argued later.
**Accept:** doc committed; all site outbound campaign links updated to the convention.

### E2 · Monthly funnel dashboard — `BOTH` · M · depends A4
Looker Studio template on GA4 (sessions → booking-start → callback/contact) + a
monthly Jane CSV export joined in a provided spreadsheet template (visits, new
patients, rebooking rate, no-shows). No custom infra — 30 minutes of owner time per
month.
**Accept:** first monthly report produced within 30 days of launch showing every KPI
from ROADMAP §3.

### E3 · GA4 event audit — `DEV` · S · buildable now
Verify every conversion surface fires the right event with the right params: hero
CTAs + new service strip, sticky mobile bar, concierge open/handoff, symptom router,
callback, intake completion, contact submit, review page, footer. Fix gaps; document
the event dictionary in `docs/ANALYTICS.md`.
**Accept:** event dictionary matches observed DebugView behavior for all surfaces.

---

## Epic F — Security hardening follow-ups (from automated audit)

### F1 · CSP nonce middleware — `DEV` · M · buildable now
`next.config.mjs`'s CSP currently allows `script-src 'self' 'unsafe-inline'`
and `style-src 'unsafe-inline'`, which neutralizes most of a CSP's XSS
mitigation value. Add `middleware.ts` that generates a per-request nonce,
forwards it via a request header, and have `app/layout.tsx` read it to set
`nonce` on any inline `<script>`/`<Script>` tags; drop `'unsafe-inline'`
from `script-src` once all inline scripts carry a nonce. `style-src
'unsafe-inline'` is harder to remove (framer-motion injects inline
styles) — track separately, lower priority.
**Accept:** CSP has no `'unsafe-inline'` in `script-src`; site renders and
functions identically; no CSP violations in browser console across all
routes.

### F2 · Durable rate-limit store — `DEV` + `OWNER` account · S
`lib/rate-limit.ts` is an in-memory `Map`, explicitly documented as a soft
throttle. On Vercel's serverless model, each function invocation can land
on a fresh instance, so the 5/min and 10/min limits on `/api/intake` and
`/api/concierge` (both calling the paid Anthropic API) are bypassable —
a real cost-DoS exposure, not just casual-bot noise. Wire in an external
store (Upstash Redis or Vercel KV) behind the same `checkRateLimit`
interface so callers don't change.
**Accept:** rate limit holds under concurrent requests hitting different
serverless instances; owner has created the Upstash/Vercel KV resource
and set its env vars.

---

## Sequencing at a glance

```
Week 1-2   A1 A2 A3 (owner inputs) ── B1 B4 C3 E1 E3 (dev builds now)
Week 2-3   A4 DNS cutover ── A5 GSC ── C4 schema audit
Week 3-4   B2 B3 (review flywheel on) ── D1 ads page
Week 4-6   D2 D3 (ads live) ── E2 first dashboard
Week 2-12  C1 location pages ── C2 one blog post/week
```

**Dev can start today, with zero owner input:** B1, B4, C1, C3, D1, E1, E3.
**Critical path is owner-side:** photos (A1), roster (A2), lawyer (A3), accounts
(A4, D2). Everything else routes around those.
