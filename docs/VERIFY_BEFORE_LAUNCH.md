# Verify Before Launch

The site is built from `content/site-content.json`. Items still marked `needsVerification`
should be **confirmed by the clinic owner** before going live — this is both an accuracy
and a compliance concern for a healthcare business.

This pass cross-checked the content against public information about the clinic
(the clinic's own indexed pages, review/booking platforms, and social profiles — the live
site itself blocks automated access, so nothing here was scraped from a page directly).
Items below are marked **✅ Confirmed**, **⚠️ Needs your input**, or **❌ Could not verify**.

## Clinic details

- ✅ **Phone** — `(604) 467-2113`
- ✅ **Email** — `kineticphysio.maple@gmail.com`
- ✅ **Address** — `#103 – 12005 238b Street, Maple Ridge, BC V4R 1W1`
- ✅ **Hours** — Mon–Fri 8am–8pm, Sat 9am–3pm, Sun/holidays closed. Matches the clinic's
  own contact page. (A third-party booking aggregator listed different Saturday/Sunday
  hours — that listing is stale; the clinic's own site is the source of truth here.)
  `needsVerification` cleared to `false` in content.
- ✅ **Social links** — Facebook and Instagram confirmed and added to the footer +
  schema (`sameAs`): `facebook.com/kinetic.theraphyclinic`, `instagram.com/kinetic.therapyclinic`.
- ⚠️ **Fax** (`(604) 608-5505`) — could not independently confirm; low-risk, keep as-is
  unless you know otherwise.
- ⚠️ **Geo coordinates** in `lib/schema.ts` — set to Maple Ridge city-center coordinates
  (49.2189, -122.601), which is accurate to the neighborhood but not the exact building.
  For pinpoint accuracy, look up the address in Google Maps, right-click the exact pin,
  and copy the lat/long shown — then update `geo` in `lib/schema.ts`.

## Trust badges & insurance wording

- ✅ **ICBC coverage** — confirmed by you: up to 12 weeks of treatment, conditions apply.
  Already updated site-wide with that exact framing.
- ⚠️ **WSBC support**, **Direct billing**, **Open evenings** badges — confirm these are
  still accurate before launch (all currently shown as true).

## Practitioners — ⚠️ important discrepancy to resolve

The original design package listed 9 practitioners. Cross-checking against public
information about the clinic surfaced **real, sourced bios for 4 of them** (now added to
`content/site-content.json`), but also turned up **names that don't appear in the
original list at all** — most likely because staff has changed since the package was
put together, or the current site includes team members the package didn't capture.

**Please confirm the current, active roster before launch.** Specifically:

- ✅ **Shanu Jadhwani** (Physiotherapist) — real bio added: Master of Physiotherapy,
  Manipal University 2010; certified Clinical Exercise Physiologist (ACSM).
- ✅ **Chandni Mistry** (Physiotherapist) — real bio added: Bachelor of Physiotherapy,
  Ahmedabad Institute of Medical Sciences; manual therapy, exercise prescription.
- ✅ **Ashwin Singh** (Kinesiologist) — real bio added: SFU, concentration in active
  rehabilitation.
- ⚠️ **Aishwariya Palsule** (Physiotherapist) — likely matches a practitioner going by
  "Ash," Bachelor's in Physiotherapy from Mumbai, India, ~6 years' experience in
  musculoskeletal and injury rehab. Surname not independently confirmed — please verify
  this is the same person before publishing the bio.
- ❌ **Dilpreet Sandhu, Jason Shi** (RMTs), **Mike Slade** (Body Worker), **Ziming Zhao**
  (Acupuncturist), **Stefanie Henderlin** (Naturotherapy/Lactation) — no public bio found
  to confirm or add; generic role-based placeholder bios are in place. Confirm these are
  still current staff.
- ⚠️ **Names that appeared publicly but are NOT in the current roster** — you may want to
  add them if they're current staff, or this may simply reflect the team at a different
  point in time:
  - **Jessica Berta** — Physiotherapist (BSc, Thompson Rivers University; MSc Physical
    Therapy, McGill University; experience with sports injuries, MVAs, post-surgical
    rehab, chronic pain, pelvic floor coursework).
  - **Preeti** — Registered Massage Therapist (West Coast College of Massage Therapy
    graduate; Level I Fascial Stretch Specialist).

  If either is current staff, tell me their full name and correct title and I'll add a
  full card for them immediately.

## Testimonials

- ⚠️ The 3 testimonials in content are from the original design package; permission/
  currency not independently re-verified. The clinic has **54 reviews on Birdeye** and
  reviews on Google/Yelp — consider pulling 3–6 real, permitted quotes from there to
  replace or supplement the current set.

## FAQs, blog drafts

- ⚠️ FAQ answers (referral, ICBC, direct billing) — confirm accuracy.
- ⚠️ All 10 blog drafts remain `draft: true` (noindexed, excluded from sitemap) — review
  for medical accuracy, then flip to `false` to publish.

## Assets — photos (⚠️ blocked on your side, not mine)

**I could not fetch any images.** The live site, Facebook, and web archives all block
automated access from this environment (403 responses / network policy) — this isn't a
choice, it's a hard technical limit here, and I won't fabricate photos of real people or
the real clinic for a healthcare business. The fastest path to real photos:

1. **Team photos** — either export them from the clinic's existing website admin/media
   library, or download them directly from Facebook/Instagram
   (`facebook.com/kinetic.theraphyclinic`, `instagram.com/kinetic.therapyclinic`) — post
   or profile photos of each practitioner.
2. **Clinic photos** — reception, treatment rooms, rehab area — same sources, or take new
   phone photos in good natural light (even 6–8 shots would transform the hero and
   clinic-experience section).
3. **Upload them to me** (drag into chat) and tell me which practitioner/section each is
   for — I'll optimize, place them in `/public/images/team/` and `/public/images/clinic/`,
   and wire them into the practitioner cards and homepage automatically.

Until then, the site uses tasteful initials avatars and branded illustrations — nothing
broken, just placeholder.

- [ ] Real hero image → replace placeholder in `components/sections/Hero.tsx`
- [ ] Clinic photos → `components/sections/ClinicExperience.tsx`
- [ ] Practitioner photos → `/public/images/team/` + set `image` in content
- [ ] Legal pages → substantive drafts in place — have a lawyer review before launch

## Pre-launch technical checklist

- [ ] `NEXT_PUBLIC_SITE_URL` set to the real production domain (canonical/sitemap/schema).
- [ ] `NEXT_PUBLIC_GOOGLE_REVIEW_URL` set to the clinic's real Google review deep link —
      without it, the `/review` page's Google review button silently points at a dead
      placeholder URL (`placeid=REPLACE_ME`).
- [ ] `NEXT_PUBLIC_WEB3FORMS_KEY` set (or accept the mailto fallback).
- [ ] `NEXT_PUBLIC_GA_ID` set to enable analytics.
- [ ] `ANTHROPIC_API_KEY` set to enable the AI concierge, symptom router, and intake summarizer.
- [ ] `npm run build` passes; `npm run typecheck` and `npm run lint` clean. *(Currently all pass.)*
- [ ] Test Book Now → Jane opens; click-to-call works on mobile; contact form delivers.
- [ ] Lighthouse: Performance 90+, Accessibility 95+, SEO 95+, Best Practices 95+.
      *(Currently 94/100/100/100 on mobile homepage — see git history for the audit.)*
- [ ] Reduced-motion: enable OS setting, confirm animations simplify. *(Verified working.)*
