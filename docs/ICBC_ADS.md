# ICBC Paid Search Campaign Blueprint

Companion to `ROADMAP.md` Epic D (ICBC paid search) and `PHASE1_TICKETS.md`
tickets **D1–D3**. The landing page (`/icbc-claims`, ticket D1) is already
built: phone-first hero CTA, callback form above the fold (`IcbcCallbackForm`),
"what happens next" 3-step strip, sticky mobile bar (`IcbcStickyBar`), and
compliance-safe ICBC wording. It's `noindex,nofollow` so it never competes
with the organic `/icbc-physio-maple-ridge` service page. This doc is the
campaign itself: keywords, ad copy, targeting, budget, and the kill/scale rule.

## Why ICBC first

Per `ROADMAP.md` §5, ICBC patients are the highest-LTV segment reachable by
paid search: up to 12 weeks of funded treatment ≈ $2,000–3,500 per claim
across disciplines (physio, massage, kinesiology, chiro, acupuncture — this
clinic's full multidisciplinary roster). A single converted click can be
worth more than a month of untargeted local-SEO spend.

## Compliance guardrails

- **No outcome or coverage guarantees.** Every ad and landing page uses "up to
  12 weeks of treatment... conditions and eligibility apply" — never "we'll
  get you 12 weeks" or "guaranteed coverage."
- **No urgency/fear-based injury-lawyer-style copy** ("don't wait, you could
  lose your claim"). Keep tone calm and informational — this is healthcare
  advertising, not legal solicitation, and overclaiming risks both Google Ads
  policy rejection (healthcare ads are reviewed) and college advertising
  rules.
- **No testimonials in ad copy** (CPTBC/CMTBC restrictions — see
  `ROADMAP.md` §6 guardrails).
- Landing page must stay `noindex,nofollow` (already set) so ad spend doesn't
  get diluted by organic competition with the service page, and so paid
  landing copy optimized for conversion (not for ranking) never gets treated
  as thin/duplicate content by Google's organic index.

## Keyword set

**Match type: exact and phrase only.** Broad match on health-condition terms
burns budget on irrelevant clicks (symptom research, other clinics, insurance
company complaints about ICBC itself).

| Theme | Keywords (exact/phrase) |
|---|---|
| Core intent | `[icbc physiotherapy maple ridge]`, `[icbc physio maple ridge]`, `"icbc massage therapy maple ridge"`, `"icbc chiropractor maple ridge"` |
| Accident + injury | `[car accident physiotherapy maple ridge]`, `"whiplash treatment maple ridge"`, `"motor vehicle accident injury clinic maple ridge"` |
| Claim-stage | `"icbc claim physiotherapy"`, `"icbc approved physiotherapist maple ridge"`, `"icbc active rehab maple ridge"` |
| Branded-adjacent | `"physio near me icbc"`, `"massage therapy car accident maple ridge"` |

### Negative keywords (apply at campaign level)

`lawyer`, `attorney`, `lawsuit`, `sue`, `claim denied`, `compensation`,
`settlement`, `free`, `jobs`, `hiring`, `courses`, `certification`, `WSBC`
(different program — its own future campaign), `-pitt meadows` /
`-coquitlam` (unless geo-targeting is widened later; keep tight to Maple
Ridge first).

## Ad variants (Responsive Search Ads, 3 headline sets)

All variants land on `/icbc-claims?utm_source=google&utm_medium=cpc&utm_campaign=icbc&utm_content=<variant>`
per the UTM convention in `docs/ANALYTICS.md` §4.

**Variant A — direct/urgent-but-compliant** (`utm_content=exact-icbc-physio`)
- Headlines: "ICBC Physiotherapy — Maple Ridge" / "Hurt in a Car Accident?" /
  "Up to 12 Weeks Treatment*" / "Call or Request a Callback" / "Multidisciplinary
  Clinic — Maple Ridge"
- Description: "Injured in a motor vehicle accident? Our Maple Ridge team can
  help you understand your ICBC treatment options. Physio, massage, chiro,
  kinesiology & acupuncture under one roof. Call now — no obligation."
- Path: `/icbc-claims`, display path `maple-ridge/icbc-recovery`

**Variant B — multidisciplinary angle** (`utm_content=exact-multidisciplinary`)
- Headlines: "5 Disciplines, 1 Clinic — Maple Ridge" / "ICBC Accident
  Recovery" / "Physio + Massage + Chiro + More" / "Same-Building Referrals" /
  "Book or Request a Callback"
- Description: "Physiotherapy, massage therapy, chiropractic, kinesiology, and
  acupuncture — coordinated care under one roof. ICBC claims welcome.
  Conditions and eligibility apply."

**Variant C — callback-first (mobile-heavy dayparting)** (`utm_content=exact-callback`)
- Headlines: "Request an ICBC Callback" / "We'll Call You Back Today" /
  "Maple Ridge Accident Recovery Clinic" / "No Obligation, No Pressure" /
  "Multidisciplinary Team Ready to Help"
- Description: "Leave your details and our Maple Ridge team will call you
  back to discuss your ICBC treatment options. Physio, massage, chiro,
  kinesiology & acupuncture."

*Sitelinks:* Book Now (Jane), Our Services, ICBC FAQ (`#faq` anchor on
`/icbc-claims`), Call the Clinic.
*Callout extensions:* "Direct Billing Available", "Same-Week Appointments",
"5 Disciplines Under One Roof", "Open Evenings".
*Call extension:* `(604) 467-2113`, click-to-call enabled, matches
`CallButton` tracking already on the page.

## Geo-targeting & budget

- **Geo:** Maple Ridge + Pitt Meadows postal codes, 10 km radius fallback.
  Do not widen to province-wide — ICBC coverage is universal in BC but drive
  time to the clinic isn't, and Maple Ridge/Pitt Meadows residents are the
  only realistic conversions.
- **Dayparting:** weight toward business hours + early evening (matches
  clinic hours: Mon–Fri 8am–8pm, Sat 9am–3pm); pause overnight when no one
  can answer a callback same-day.
- **Budget cap:** **$1,000–1,500/month**, per `ROADMAP.md` §4 Phase 1 item 4.
  Start at the low end for the first 2 weeks to gather conversion data before
  scaling spend.
- **Bid strategy:** start Manual CPC or Maximize Conversions with a
  conservative daily cap; switch to Target CPA once ≥ 15–20 conversions have
  accumulated (Google Ads needs that volume for automated bidding to
  calibrate).

## Kill / scale rule

Defined once, here, so it's never argued after the fact:

- **CAC < $60 per booked new patient → scale** (increase budget in ~20%
  increments, re-evaluate weekly).
- **CAC $60–$100 → hold** (no budget change; iterate on ad copy/landing page
  instead).
- **CAC > $100 sustained over 2+ weeks with ≥ 10 clicks/day → pause** the
  campaign and revisit keyword set, negatives, and landing page before
  relaunching.

CAC here means Google Ads spend ÷ **booked** new patients (Jane booking-start
or completed callback that converts to a booked visit), not raw form
submissions — a callback that never becomes an appointment doesn't count.

## Dependencies before launch (ticket D2, owner-side)

1. Google Ads account access granted to whoever manages the campaign.
2. GA4 ↔ Google Ads linked; import GA4 conversions (booking-start click,
   callback submit, click-to-call — all already fire distinct GA4 events per
   `docs/ANALYTICS.md`).
3. Confirm test conversions appear in Google Ads within 24h of linking before
   spending real budget.
4. Production domain live (ticket A4) — the landing page must be reachable at
   the real domain, not a preview URL, before ads point at it.

## Post-launch checklist (first 2 weeks)

- [ ] Confirm `/icbc-claims` stays out of Google's organic index (`noindex`
      still respected — check Search Console URL Inspection).
- [ ] Verify sticky mobile bar and callback form both fire GA4 events on
      real ad traffic (DebugView or GA4 real-time, filtered to
      `utm_campaign=icbc`).
- [ ] Daily spend pacing check for the first week — catch runaway bids early.
- [ ] Weekly CAC calculation against the kill/scale rule above.
