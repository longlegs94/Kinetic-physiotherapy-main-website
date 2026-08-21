# Kinetic Physiotherapy — Product & Growth Roadmap

*Written from the seat of CPO/CEO. Last updated: July 2026.*

---

## 1. The one-sentence strategy

**Turn the website from a brochure into the clinic's revenue engine: fill practitioner
calendars first, then convert one-time patients into recurring relationships, then sell
what we've built to other clinics.**

Everything below serves one of those three moves, in that order. A clinic's economics
are simple: revenue = (booked hours × utilization × average visit value) + non-visit
revenue. The website can move every one of those variables.

## 2. Where we are (honest inventory)

**Assets already built:**
- Modern, fast site (Lighthouse 94–100) with 9 SEO service pages, per-service FAQs +
  schema, 301 map from the old WordPress site — a genuine local-SEO head start.
- AI layer nobody else in Maple Ridge has: booking concierge, symptom router, pre-visit
  intake summarizer, FAQ assistant, callback capture.
- Conversion plumbing: GA4 events on every booking/call surface, Jane integration,
  hardened forms.
- Multidisciplinary roster (physio, RMT, chiro, kin, acupuncture) — the structural
  advantage: cross-referral happens inside the building.

**Honest gaps:**
- No real photos → trust ceiling. This is the single cheapest high-impact fix.
- No post-visit relationship: a patient finishes treatment and we go silent.
- Revenue is 100% appointment-hours. Zero recurring, zero retail, zero B2B.
- We don't yet *measure* the funnel end-to-end (site → booking → completed visit →
  rebooking) because Jane data and site data aren't joined.

## 3. North-star metric & the numbers that matter

**North star: net new patient visits per month attributable to the site.**

Supporting KPIs by funnel stage:

| Stage | Metric | Target (12 mo) |
|---|---|---|
| Attract | Organic sessions from Maple Ridge/Pitt Meadows | 3× baseline |
| Convert | Site → Jane booking-start rate | ≥ 6% of sessions |
| Show | No-show/late-cancel rate | < 5% |
| Retain | 90-day rebooking rate | > 45% |
| Expand | Non-appointment revenue share | 10–15% of total |

Instrument first, brag later: Phase 1 includes joining GA4 + Jane exports into one
simple monthly dashboard before we scale spend on anything.

---

## 4. The roadmap — four phases

### Phase 1 (Months 0–3): Launch & fill the funnel
*Goal: go live, dominate "physio near me" in Maple Ridge, prove the site books patients.*

1. **Launch blockers** — photos, roster confirmation, lawyer-reviewed legal pages,
   env keys, DNS cutover (see `VERIFY_BEFORE_LAUNCH.md`).
2. **Google Business Profile flywheel** — the highest-ROI channel in local healthcare,
   full stop. Post-visit review-request automation (email/SMS via Jane), respond to
   every review, weekly GBP posts. Target: +15 Google reviews/month.
   ⚠️ *Compliance note: CPTBC and other BC health colleges restrict testimonial use in
   advertising by regulated professionals — route reviews to Google/the clinic listing
   rather than quoting them in our own ads; get college-specific guidance before any
   testimonial campaign.*
3. **Local SEO expansion** — suburb/landing pages (Pitt Meadows, Albion, Silver Valley,
   Websters Corners), publish remaining blog drafts on a weekly cadence, internal
   linking from posts to service pages.
4. **ICBC paid search** — one tightly-scoped Google Ads campaign on ICBC/car-accident
   terms. ICBC patients are the highest-LTV segment (up to 12 weeks of funded
   treatment ≈ $2,000–3,500 per claim across disciplines) and the site already has a
   dedicated ICBC page + intake flow. Cap at $1–1.5k/mo until CAC is proven < $60.
5. **Measurement** — monthly funnel dashboard (GA4 + Jane export). Define visit
   attribution rules now, not after we're arguing about them.

### Phase 2 (Months 3–6): Convert & retain
*Goal: raise revenue per patient without raising visit prices.*

1. **AI phone agent** (already scoped in `docs/AI_PHONE_AGENT.md`) — after-hours and
   overflow calls answered, booked, or captured. Missed calls are the leakiest bucket
   in every clinic; this is the most innovative near-term feature and pure found revenue.
2. **Recovery Companion (new, differentiating)** — opt-in post-visit AI check-ins:
   day-2 "how are you feeling?" SMS/email, home-exercise reminders pulled from the
   practitioner's plan, and a "book your follow-up" nudge timed to the treatment plan.
   Nobody local does this. It directly attacks the 90-day rebooking metric, and it
   reuses the concierge backend we already built.
3. **Smart recall campaigns** — automated, segment-aware win-back (lapsed 60/90/180
   days, per discipline). Boring, proven, prints money.
4. **Online gift cards + packages** — RMT gift cards (Mother's Day/Christmas spikes)
   and prepaid visit packs, sold on the site. First non-appointment revenue with
   near-zero marginal cost.
5. **No-show defense** — deposit or card-on-file for new-patient RMT bookings,
   automated reminders. Every avoided no-show is ~$100+ recovered.

### Phase 3 (Months 6–12): New revenue lines
*Goal: 10–15% of revenue from things that aren't 1:1 appointment hours.*

1. **Kinetic Membership** — monthly wellness plan (e.g., $89/mo: one RMT or physio
   maintenance visit, priority booking, member rates on extras, guest pass). Converts
   episodic patients into subscribers; smooths cash flow; deepens loyalty. Start with a
   50-member pilot, price-test before scaling.
2. **Group programming** — small-group active rehab / clinical exercise classes run by
   kinesiologists (one practitioner-hour serving 6–8 payers instead of 1). ICBC active
   rehab referrals feed this directly.
3. **Retail & digital** — curated recovery products (bracing, orthotics follow-through,
   home rehab kits) sold at visit + on the site; a paid "back-pain fundamentals" video
   program as the digital-product toe-dip.
4. **B2B: Kinetic at Work** — ergonomic assessments, WSBC return-to-work coordination,
   and on-site clinic days for Maple Ridge/Pitt Meadows employers. One corporate
   account is worth dozens of one-off patients, and the sales asset is a single new
   landing page + outreach.
5. **Telehealth** — virtual physio consults for triage, rural patients, and follow-ups
   that don't need hands-on time. Low build cost (Jane supports it); expands the
   service radius beyond driving distance.

### Phase 4 (Months 12+): The company beyond the clinic
*Goal: make what we built worth more than one clinic's patient list.*

1. **"Kinetic OS" — license the stack.** The genuinely new-perspective play: the AI
   concierge + symptom router + intake summarizer + recall engine we built is not
   Maple-Ridge-specific. Package it as a white-label product for other independent
   clinics ($300–800/mo SaaS). Our own clinic becomes the living case study
   ("we increased rebooking X% — this is the software that did it"). This changes the
   company from a services business (sells hours, linear growth) into a
   services + software business (sells outcomes, compounding growth).
2. **Second location / partner clinics** — the playbook (site template, SEO system,
   AI stack, membership model) makes expansion largely a copy-paste + hiring problem.
   Pitt Meadows or Mission are the natural adjacencies.
3. **Outcome data as moat** — anonymized, consented outcome tracking (pain scores from
   Recovery Companion check-ins) becomes both a marketing asset ("our low-back-pain
   patients report X% improvement by week 4") and the substance behind Kinetic OS.

---

## 5. Monetization summary (stack-ranked by effort-to-impact)

| Idea | Effort | Annual impact (est.) | Phase |
|---|---|---|---|
| GBP reviews + local SEO | Low | High — compounding patient flow | 1 |
| ICBC paid search | Low | $50–150k funded-treatment revenue | 1 |
| AI phone agent (missed-call capture) | Med | $30–80k recovered bookings | 2 |
| Recall campaigns + Recovery Companion | Med | +10–20% rebooking → largest single lever | 2 |
| Gift cards + packages | Low | $15–40k, seasonal spikes | 2 |
| Membership (50→200 members) | Med | $50–200k recurring | 3 |
| Group active rehab | Med | 4–6× revenue per kin-hour | 3 |
| Kinetic at Work (B2B) | Med | $30–100k/account-dependent | 3 |
| Kinetic OS licensing | High | $50k+ ARR at 10 clinics; changes the company | 4 |

## 6. Guardrails (what we will NOT do)

- **No medical or coverage guarantees, ever** — the accuracy rules baked into the site
  copy apply to every campaign, email, and AI response.
- **No testimonial advertising without college compliance review** (CPTBC/CMTBC rules).
- **No AI feature that touches diagnosis** — the AI routes, reminds, and books; humans
  treat. That line is both an ethical and a liability boundary.
- **PIPA/PIPEDA discipline** — every new data flow (SMS check-ins, outcome tracking,
  memberships) gets added to the privacy policy before it ships, with explicit opt-in.
- **No channel scaling before its CAC is measured** — dashboard first, budget second.

## 7. The 90-day scoreboard

If we execute Phase 1, by the end of month 3 we should see:
- Site live on the production domain with real photos and confirmed roster.
- 40+ new Google reviews; ranking top-3 in the local pack for "physiotherapy maple ridge".
- Funnel dashboard running; ICBC campaign live with measured CAC.
- First month with 30+ site-attributed new-patient bookings.

If those numbers appear, Phases 2–3 are funded by results, not faith.
