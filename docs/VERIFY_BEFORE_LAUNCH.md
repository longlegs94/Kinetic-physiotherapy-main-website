# Verify Before Launch

The site is built from `content/site-content.json`. Several items are marked
`needsVerification` in that file because they should be **confirmed by the clinic owner**
before going live. This is both an accuracy and a compliance concern — the site must not
guarantee medical outcomes or insurance coverage.

## Content to confirm (from `content/site-content.json`)

### Clinic details
- [ ] **Address** — `#103 – 12005 238b Street, Maple Ridge, BC V4R 1W1`
- [ ] **Phone** — `(604) 467-2113`
- [ ] **Email** — `kineticphysio.maple@gmail.com`
- [ ] **Fax** — `(604) 608-5505`
- [ ] **Jane booking URL** — `https://kineticphysiotherapy.janeapp.com/`
- [ ] **Hours** (Mon–Fri, Sat, Sun) — all flagged `needsVerification`
- [ ] **Geo coordinates** in `lib/schema.ts` (`geo`) — currently approximate; set exact
      lat/long for accurate Google map/schema.

### Trust badges (`clinic.trustBadges`)
Only keep badges that are accurate:
- [ ] ICBC Accepted
- [ ] WSBC Support
- [ ] Direct Billing
- [ ] Open Evenings

### Insurance / injury wording
- [ ] **ICBC** service copy uses non-guaranteeing language ("may be covered", "we can help
      you understand your next steps"). Confirm nothing implies guaranteed coverage.
- [ ] **WSBC** wording confirmed.
- [ ] **Direct billing** wording confirmed (providers, what's actually billed directly).
- [ ] **Shockwave** and **Orthotics/Bracing** copy — confirm claims; kept cautious by default.

### Practitioners (`practitioners`)
All 9 are `needsVerification`. For each: confirm name spelling, title/registration, whether
they accept ICBC, and current schedule. Add `bio`, `specialInterests`, and a photo
(`image: "/images/team/<file>"`) when available.
- [ ] Dilpreet Sandhu (RMT) · [ ] Jason Shi (RMT) · [ ] Mike Slade (Body Worker)
- [ ] Shanu Jadhwani (Physio) · [ ] Chandni Mistry (Physio) · [ ] Aishwariya Palsule (Physio)
- [ ] Ashwin Singh (Kinesiologist) · [ ] Ziming Zhao (Acupuncturist)
- [ ] Stefanie Henderlin (Naturotherapy / Lactation)

### Testimonials (`testimonials`)
- [ ] Confirm you have permission to display each review and that the source is current.

### FAQs (`faqs`)
- [ ] Referral, ICBC, and direct-billing answers confirmed accurate.

### Blog drafts (`content/blog/*.mdx`)
- [ ] Review the 3 starter drafts for medical accuracy, then set `draft: false` to publish.
      Drafts are `noindex` and excluded from the sitemap until published.

## Assets to add
- [ ] Real hero image → replace placeholder in `components/sections/Hero.tsx`
- [ ] Clinic photos → `components/sections/ClinicExperience.tsx`
- [ ] Practitioner photos → `/public/images/team/` + set `image` in content
- [ ] Official logo (optional) → `components/layout/Logo.tsx`
- [ ] Legal pages → replace placeholders in `app/privacy-policy` and `app/terms`

## Pre-launch technical checklist
- [ ] `NEXT_PUBLIC_SITE_URL` set to the real production domain (canonical/sitemap/schema).
- [ ] `NEXT_PUBLIC_WEB3FORMS_KEY` set (or accept the mailto fallback).
- [ ] `NEXT_PUBLIC_GA_ID` set to enable analytics.
- [ ] `npm run build` passes; `npm run typecheck` and `npm run lint` clean.
- [ ] Test Book Now → Jane opens; click-to-call works on mobile; contact form delivers.
- [ ] Lighthouse: Performance 90+, Accessibility 95+, SEO 95+, Best Practices 95+.
- [ ] Reduced-motion: enable OS setting, confirm animations simplify.
