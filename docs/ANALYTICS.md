# Analytics, Attribution & Event Tracking

Companion to `ROADMAP.md` §3 (KPIs) and `PHASE1_TICKETS.md` Epic E (Measurement).
Covers tickets **E1** (attribution rules + UTM conventions) and **E3** (GA4 event
audit). Written to match what the code actually does as of this audit — nothing
below describes tracking that isn't wired up. Anything aspirational is called out
explicitly in the "Recommended (not yet implemented)" section at the end.

---

## 1. How tracking works

- **Single dispatch point:** `lib/analytics.ts` exports `trackEvent(event, params)`.
  Every conversion surface in the app calls this — there is no other analytics
  code path.
- **GA4:** `trackEvent` calls `window.gtag("event", event, params)` if `gtag` is
  defined. `gtag` is only defined when `components/analytics/Analytics.tsx` loads
  the GA4 script, which only happens when `NEXT_PUBLIC_GA_ID` is set. With no GA
  ID, every `trackEvent` call is a no-op except for the line below.
- **Debug hook:** every call also dispatches a `window` `CustomEvent` named
  `kt:conversion` with `{ event, params }` in `detail`. Nothing in the repo
  listens for this today — it exists for local debugging (e.g. `window
  .addEventListener('kt:conversion', console.log)` in the browser console) and as
  a hook for a future provider.
- **No other provider is wired in.** There is no `@vercel/analytics` dependency
  in `package.json` and nothing else consumes `kt:conversion`. (The file's
  docstring used to claim it "always sends to Vercel Analytics if present" — that
  was inaccurate and has been corrected as part of this audit.)
- **GA4 "key events"** (GA4's current name for what used to be called
  "conversions") must be marked manually in the GA4 UI per event name — the code
  doesn't do this. See the setup checklist (§5).

---

## 2. Event dictionary

Every member of the `ConversionEvent` union in `lib/analytics.ts`, where it
fires, its params, and the funnel stage / KPI it feeds (see `ROADMAP.md` §3).

| Event | Fires in | Params | Funnel stage / KPI |
|---|---|---|---|
| `jane_outbound_click` | `components/ui/BookButton.tsx` — every "Book Now" style CTA across the site (hero, header, footer, mobile nav, service pages, practitioner cards, service cards, location pages, about/team/testimonials/services/blog final CTAs, ICBC section, 404 page). Fires whenever the button's `href` resolves to the default Jane booking URL (true for every current call site). | `{ source }` — a string identifying the CTA's placement, e.g. `hero`, `header`, `footer`, `mobile_nav`, `service:{slug}`, `service_why:{slug}`, `service_final:{slug}`, `service_card:{slug}`, `practitioner:{name}`, `location:{slug}`, `about_hero`, `icbc_section`, `404`, etc. Defaults to `generic` if a caller omits `source`. | **Convert** — this is the primary "booking-start" signal. See Attribution Rules (§3). |
| `book_now_click` | Same component (`BookButton.tsx`), same code path, but only when a caller passes a custom `href` that is *not* the Jane URL. **No current call site does this** — every `BookButton` on the site uses the default Jane href, so this branch is live code but currently unreachable in practice. Kept for a future non-Jane booking flow. | `{ source }` | Convert (would be booking-start via a non-Jane path, if ever used) |
| `phone_click` | `components/ui/CallButton.tsx` — every click-to-call button (header, hero, service pages, location pages, ICBC page, sticky bars, concierge fallback links are plain `<a>` tags and do *not* fire this — see gap note below). | none | **Convert** — phone-in booking intent. |
| `contact_submit` | `components/cards/ContactForm.tsx` — general contact form, on successful send. | `{ method: "mailto" \| "relay" }` | Convert — general enquiry/callback request. |
| `intake_submit` *(added this audit)* | `components/intake/IntakeForm.tsx` — pre-visit intake form, on successful send (after the AI-summary review step). | `{ method: "mailto" \| "relay" }` | Convert — pre-visit intake completion; a strong high-intent signal (patient has already committed to a visit and prepped for it). |
| `service_card_click` | `components/cards/ServiceCard.tsx` — title and "Learn more" links on service cards (used in related-services grids etc). `components/sections/Hero.tsx` — the 5 homepage hero service-strip links *(added this audit)*. | `ServiceCard.tsx`: `{ service: slug }`. `Hero.tsx`: `{ source: "hero_strip", service: slug }`. See Params Consistency note below — the `source` key isn't populated by `ServiceCard.tsx`'s own calls. | Attract → Convert — service-page navigation intent. |
| `pain_point_click` | `components/cards/PainPointSelector.tsx` — homepage "what brings you in" cards. | `{ pain: point.label }` | Attract — self-routing / intent signal. |
| `icbc_cta_click` | `components/icbc/TrackedCta.tsx` (wraps a `CallButton`/`BookButton`/anchor, used on `/icbc-claims`) and `components/icbc/IcbcStickyBar.tsx` (mobile sticky bar on `/icbc-claims`). | `{ cta, source }` — `cta` values in use: `hero_call`, `hero_callback`, `final_call`, `final_callback`, `final_book`, `sticky_call`, `sticky_callback`. `source` is `icbc_ads` everywhere it fires. | Convert — ICBC paid-search funnel (Epic D). **Note:** `TrackedCta` wraps `CallButton`/`BookButton`, so an ICBC-page click fires *both* `icbc_cta_click` **and** the inner button's own event (`phone_click` or `jane_outbound_click`). This is intentional (per the component's own docstring) — don't double-count when reading `phone_click`/`jane_outbound_click` totals against ICBC-specific totals. |
| `icbc_callback_submit` | `components/icbc/IcbcCallbackForm.tsx` — ICBC ads landing page callback form, on successful send. | `{ method: "mailto" \| "relay" }` | Convert — highest-value ICBC ads conversion (Epic D primary conversion per D2). |
| `practitioner_book_click` | **Never fires.** See Dead Union Entries (§2.1). | — | — |
| `sticky_bar_click` | `components/layout/StickyMobileBookingBar.tsx` — global mobile sticky bar (suppressed on `/icbc-claims`, which has its own bar). | `{ action: "book" \| "call" }` | Convert — mobile booking-start / call intent. |
| `concierge_open` | `components/concierge/ConciergeWidget.tsx` — fires when the floating chat widget is opened (including when summoned via the FAQ "Ask our assistant" button's global event). | none | Attract → Convert — AI concierge engagement. |
| `concierge_book_click` | `ConciergeWidget.tsx` and `components/concierge/SymptomRouter.tsx` — "Book Now" link shown inline in a concierge/symptom-router reply. | none | Convert — AI-assisted booking-start. **Note:** this link opens Jane directly via a plain `<a href={janeBookingUrl}>`, not `BookButton`, so it does *not* also fire `jane_outbound_click`. |
| `concierge_service_click` | `ConciergeWidget.tsx` and `SymptomRouter.tsx` — service links shown inline in a reply. | `{ service: slug }` | Attract → Convert — AI-assisted service routing. |
| `symptom_router_submit` | `components/concierge/SymptomRouter.tsx` — homepage free-text "describe it in your own words" box, on submit. | none | Attract — self-routing intent. |
| `review_google_click` | `app/review/ReviewOptions.tsx` — "Leave a Google review" link. | none | Retain/Expand — GBP review flywheel (Epic B). |
| `review_feedback_submit` | `app/review/ReviewOptions.tsx` — private feedback form, on successful send. | `{ method: "mailto" \| "relay" }` | Retain — private feedback capture (non-public alternative to a Google review). |
| `review_cta_click` | `components/cards/ContactForm.tsx` — "Loved your visit? Leave us a review" link shown after a successful contact submission. `components/layout/SiteFooter.tsx` — footer "Leave a Review" link *(added this audit)*. | `{ source: "contact_success" \| "footer" }` | Retain — traffic into the `/review` funnel (ties to Epic B4's "GA4 event fires" acceptance criterion for both the contact-form success state and the footer link). |

### 2.1 Dead union entries

- **`practitioner_book_click`** is declared in the `ConversionEvent` union but is
  never fired anywhere in the codebase. `components/cards/PractitionerCard.tsx`
  uses the shared `BookButton` (with `source="practitioner:{name}"`), which fires
  `jane_outbound_click`/`book_now_click` instead — a deliberate design choice so
  all "book" clicks funnel into one pair of events distinguished by `source`,
  rather than one event per surface. Per instruction, this entry was **not
  deleted** (kept in case a distinct practitioner-funnel-stage event is wanted
  later) but is flagged here as currently unused. A code comment in
  `lib/analytics.ts` points back to this section.
- **`book_now_click`** is not dead code (the branch is reachable) but is
  currently **never fired in practice** — every `BookButton` call site in the
  repo uses the default Jane `href`, so the `jane_outbound_click` branch always
  wins. Not a bug; just worth knowing so nobody expects volume on this event name
  yet.

### 2.2 Gaps found and closed in this audit

| Gap | Fix |
|---|---|
| Intake form completion fired the generic `contact_submit` event (with a `method: "intake_prepare"/"intake_mailto"/"intake_relay"` param) instead of its own event, making it indistinguishable from the plain contact form in aggregate `contact_submit` counts. | Added `intake_submit` to the `ConversionEvent` union and repointed `IntakeForm.tsx`'s two successful-send calls to fire it with `{ method: "mailto" | "relay" }`, matching the param convention already used by `ContactForm.tsx` / `IcbcCallbackForm.tsx` / `ReviewOptions.tsx`. |
| `IntakeForm.tsx` also fired `contact_submit` with `method: "intake_prepare"` at the *first* step (clicking "Prepare my summary", before the AI-summary review screen) — before anything was actually sent to the clinic. This meant every intake attempt counted as a "contact_submit" conversion even if the visitor abandoned at the review step. | Removed this premature call. Only the actual send (`handleSend`) now fires an event, so `intake_submit` accurately reflects completed intake submissions only. |
| The 5 homepage hero service-strip links (`components/sections/Hero.tsx`) had no click tracking at all. | Added `service_card_click` with `{ source: "hero_strip", service: slug }`, reusing the existing event name per instruction rather than inventing a new one. |
| The footer "Leave a Review" link (`components/layout/SiteFooter.tsx`) had no click tracking, even though ticket B4's acceptance criterion is "CTAs render, link to `/review`, GA4 event fires" for *both* the contact-form success state and the footer. Only the contact-form one fired. | Added `review_cta_click` with `{ source: "footer" }`. This required adding `"use client"` to `SiteFooter.tsx` (it was a server component; the onClick handler needs it). |
| Header (`SiteHeader.tsx`) and mobile nav sheet (`MobileNavSheet.tsx`) "Book Now" buttons didn't pass a `source` prop, so both fell into the `generic` bucket, indistinguishable from each other and from any other unlabeled future call site. | Added `source="header"` and `source="mobile_nav"` respectively. |
| `lib/analytics.ts`'s docstring claimed events are "always sent to Vercel Analytics if present" — there is no `@vercel/analytics` dependency and no code that calls it. | Corrected the comment to describe only what actually happens (GA4 + the `kt:conversion` CustomEvent). |

### 2.3 Known inconsistency, flagged but not fixed (surgical scope)

- **`phone_click` carries no params anywhere.** Every other repeatable CTA
  (`sticky_bar_click`, `icbc_cta_click`, `jane_outbound_click`/`book_now_click`)
  carries a `source` (or `action`/`cta`) key identifying where it fired, but
  `CallButton.tsx` doesn't accept or forward one. Threading a `source` prop
  through `CallButton` touches ~10 call sites across the app; left as a
  Recommended item (§6) rather than done here, since the ICBC page already gets
  page-level phone-click resolution for free via the `icbc_cta_click` wrapper
  (§2, `icbc_cta_click` row).
- **`service_card_click` doesn't uniformly carry `source`.** `ServiceCard.tsx`'s
  two call sites only send `{ service }`; only the new `Hero.tsx` hero-strip
  call sends `{ source, service }`. Fixing this fully would mean adding a
  `source` prop to `ServiceCard` and updating every place it's rendered — out of
  scope for a surgical audit fix. Noted for a future pass.

---

## 3. Attribution rules

Jane (the booking system) completes the actual appointment booking **off-site**
— nothing on kinetictherapyclinic.ca can observe whether a Jane session that
opened actually resulted in a booked appointment. Everything below is therefore
an intent/leading-indicator signal, not a confirmed booking. This distinction
must hold every time these numbers are reported, per `ROADMAP.md`'s "instrument
first, brag later" principle.

### 3.1 "Site-attributed booking-start" (primary GA4 proxy)

Defined as **any of these events firing in a session**:

- `jane_outbound_click` (or `book_now_click`, if ever used) — the visitor
  clicked through to Jane's booking widget. This is the direct analogue of
  `ROADMAP.md` §3's "Site → Jane booking-start rate ≥ 6% of sessions" KPI:
  `booking-start rate = sessions with jane_outbound_click / total sessions`.
- `concierge_book_click` — the AI concierge/symptom router linked the visitor to
  Jane directly (bypasses `BookButton`, so counts separately, not doubled with
  `jane_outbound_click`).

A booking-start is **not** a booked patient. Some fraction click through and
abandon Jane's widget; some fraction of Jane bookings never had a
`jane_outbound_click` (e.g. a returning patient who has Jane bookmarked, or a
phone booking). Report booking-start rate as a leading indicator, and reconcile
against actual Jane new-patient counts monthly (§4, and ticket E2).

### 3.2 Phone and form conversions (secondary, higher-certainty-of-contact but lower-certainty-of-booking)

These represent a real, trackable point of contact with the clinic, but — like
booking-start — do **not** confirm a booked or completed visit:

- `phone_click` — visitor tapped a click-to-call link. Counts intent to call,
  not that the call connected or resulted in a booking. On mobile this is a
  strong signal (a tap immediately opens the dialer); still can't be joined to
  a Jane record without the clinic manually asking "how did you hear about us"
  or matching phone numbers.
- `contact_submit`, `intake_submit`, `icbc_callback_submit`,
  `review_feedback_submit` — form completions. Each represents a real inbound
  lead the clinic received (mailto fallback or relay), which is a materially
  stronger signal than a click, but the visit still isn't observable on-site.
  These should be counted as "leads," and reconciled against Jane's "new
  patient" count and the clinic's own inbox to know what fraction convert.

### 3.3 What counts as "site-attributed" in the monthly Jane reconciliation

Because Jane completion isn't observable, the monthly dashboard (ticket E2) has
to join two data sources by hand. Until a UTM-passthrough or booking-intake
question exists in Jane, use this working definition:

- **Directly attributed:** a new Jane patient whose intake notes/first
  appointment note explicit ICBC-ads or "found us online" origin, or whose
  booking timestamp falls within a tight window (same day) of a
  `jane_outbound_click`/`icbc_callback_submit`/`contact_submit` spike with
  matching name/phone/email captured by the form.
- **Assisted:** any new Jane patient in a month where GA4 shows a
  `jane_outbound_click` from the same source category (e.g. ICBC ads) without an
  exact match — count these separately, don't merge into "directly attributed."
- **Unattributed:** walk-ins, phone bookings with no matching form/click, and
  referrals — the baseline the site isn't claiming credit for.

This is intentionally conservative so numbers aren't inflated before anyone
argues about them (per E1's stated purpose).

---

## 4. UTM conventions

Standard GA4 params: `utm_source`, `utm_medium`, `utm_campaign`, and optionally
`utm_content` to distinguish creative/placement within a campaign. Use lowercase,
hyphenated values everywhere — GA4 treats casing as distinct values.

| Channel | `utm_source` | `utm_medium` | `utm_campaign` | Notes |
|---|---|---|---|---|
| Google Business Profile — profile link / "Website" button | *(none — GBP appends its own tracking, do not override)* | — | — | Do not hand-tag the GBP website button; Google auto-tags it. Only tag links **you place** inside GBP posts/Q&A. |
| GBP posts (weekly post cadence, ticket B3) | `google` | `organic` | `gbp-post-{yyyy-mm-dd}` or a short post theme, e.g. `gbp-post-icbc-awareness` | Distinguishes traffic from a specific GBP post vs. the passive profile listing. |
| Review-request link (SMS/email/QR from Jane post-visit automation, ticket B2) | `jane` | `sms` or `email` (match the actual send channel) | `review-request` | Points at `/review`. Use `utm_content` for the specific template version if A/B testing copy, e.g. `utm_content=v1`. |
| Review page QR code (in-clinic signage) | `qr` | `offline` | `review-request` | Same destination, distinct source so QR scans don't get folded into SMS/email numbers. |
| ICBC Google Ads (Epic D) | `google` | `cpc` | `icbc` | Add `utm_content` per ad group/keyword theme if running more than one, e.g. `utm_content=exact-icbc-physio`. |
| Email campaigns (general, non-review) | `newsletter` (or the specific list name) | `email` | short campaign slug, e.g. `spring-2026` | — |
| Facebook/Instagram organic posts | `facebook` / `instagram` | `social` | post theme slug | Only needed if posting links off-platform; most social engagement won't carry UTMs. |
| Old WordPress 301 redirects | *(no UTM — preserve referrer only)* | — | — | Don't add UTMs to the redirect map; that would misattribute organic/direct traffic as a campaign. |

### Copy-paste examples

**Review page**, tagged for a post-visit SMS send:
```
https://www.kinetictherapyclinic.ca/review?utm_source=jane&utm_medium=sms&utm_campaign=review-request
```

**Review page**, tagged for the in-clinic QR code:
```
https://www.kinetictherapyclinic.ca/review?utm_source=qr&utm_medium=offline&utm_campaign=review-request
```

**ICBC Google Ads landing page** (`/icbc-claims`), tagged for a specific ad group:
```
https://www.kinetictherapyclinic.ca/icbc-claims?utm_source=google&utm_medium=cpc&utm_campaign=icbc&utm_content=exact-icbc-physio
```

Google Ads' auto-tagging (`gclid`) is also fine to rely on for GA4 ↔ Ads linked
reporting (ticket D2) — the UTMs above are for manual GA4 channel grouping and
Looker Studio segmentation independent of the Ads-GA4 link.

> **Note:** the codebase has no UTM-parsing/persistence logic today (no code
> reads `utm_*` params, and ticket D1's "`?utm_medium=cpc` styling" for a
> distraction-free ad-traffic layout is not implemented). UTM params survive
> automatically through GA4's own session tracking once GA4 is loaded — no
> custom code is required for GA4 attribution itself. Custom UTM-based page
> behavior (D1) is a separate, not-yet-built feature; see §6.

---

## 5. Monthly dashboard definition

Ticket E2 (Looker Studio + Jane CSV, monthly, ~30 min of owner time) — this repo
doesn't build that dashboard, but here is which GA4 event maps to which
`ROADMAP.md` §3 KPI so the dashboard and this doc never disagree:

| KPI (ROADMAP §3) | Primary GA4 signal | Jane data needed |
|---|---|---|
| Attract — organic sessions from Maple Ridge/Pitt Meadows | GA4 sessions, filtered by default channel group = Organic Search and geo = Maple Ridge/Pitt Meadows | none |
| Convert — Site → Jane booking-start rate (≥ 6% of sessions) | `jane_outbound_click` (+ `concierge_book_click`) count ÷ total sessions | none for the rate itself; Jane's actual booking count is needed to compute the booking-start → completed-booking drop-off, which is a useful secondary number even though it's not the KPI itself |
| Show — no-show/late-cancel rate (< 5%) | not measurable from the site | 100% from Jane's monthly export |
| Retain — 90-day rebooking rate (> 45%) | not measurable from the site | 100% from Jane's monthly export |
| Expand — non-appointment revenue share (10–15%) | not measurable from the site (no e-commerce on-site yet — see ROADMAP Phase 2/3) | 100% from Jane/accounting |
| Supporting: lead volume | `contact_submit` + `intake_submit` + `icbc_callback_submit` + `phone_click` counts | cross-check against actual clinic inbox/call log volume |
| Supporting: ICBC ads CAC (Epic D3 kill/scale rule) | `icbc_cta_click` + `icbc_callback_submit` (Ads spend ÷ callback submits, once GA4↔Ads is linked per D2) | Jane data to confirm how many callback submits became billed ICBC patients |
| Supporting: review flywheel (+15 Google reviews/month) | `review_google_click` (click-through only — GA4 cannot see whether a review was actually posted) | Google Business Profile review count, checked manually |

**The dashboard cannot compute Show, Retain, or Expand from GA4 alone.** Those
three KPIs require the Jane CSV export every month, joined by hand into the
spreadsheet template referenced in ticket E2. This doc doesn't build that
spreadsheet (that's E2's own deliverable) — it only fixes which GA4 numbers feed
which KPI so the two documents stay consistent.

---

## 6. Setup checklist

- [ ] Set `NEXT_PUBLIC_GA_ID` in the production environment (Vercel project env
      vars) to the GA4 Measurement ID. Until this is set, `components/analytics
      /Analytics.tsx` renders nothing and every `trackEvent` call is a no-op for
      GA4 (the `kt:conversion` CustomEvent still fires locally, but nothing
      external records it).
- [ ] After deploying with `NEXT_PUBLIC_GA_ID` set, open GA4 DebugView (enable
      the [GA Debugger extension](https://chromewebstore.google.com/) or add
      `?gtm_debug=1`) and click through every surface in the Event Dictionary
      (§2) — confirm each event fires with the params listed. This is E3's
      acceptance criterion: "event dictionary matches observed DebugView
      behavior for all surfaces."
- [ ] In GA4 Admin → Events, mark these as **key events** (GA4's current name
      for "conversions"): `jane_outbound_click`, `phone_click`,
      `icbc_callback_submit`, `contact_submit`, `intake_submit`. These are the
      events with clear conversion/lead intent named explicitly in Epic D2's
      "define primary conversions" and Epic E3's audit scope. `book_now_click`
      is not currently reachable (§2.1) — mark it too if/when a non-Jane
      booking flow ships, so it's not missed later.
- [ ] Link GA4 ↔ Google Ads (ticket D2) once the Ads account exists, so ICBC
      campaign clicks join with `icbc_cta_click`/`icbc_callback_submit` data
      and Ads conversion import can use the key events above.
- [ ] Set `NEXT_PUBLIC_GOOGLE_REVIEW_URL` (the clinic's actual Google
      review deep link, from the Google Business Profile place ID) —
      `app/review/ReviewOptions.tsx` falls back to a placeholder URL
      (`REPLACE_ME`) until this is set, which would make `review_google_click`
      fire correctly but send visitors to a broken review link. This is also
      called out as a `TODO(verify)` in that file and is a launch blocker
      independent of analytics.
- [ ] Once E2's dashboard exists, sanity-check one month of `jane_outbound_click`
      volume against Jane's actual new-patient count to calibrate how much
      drop-off happens between "clicked Jane" and "booked" — this ratio is
      useful context every month even though it isn't a KPI itself.

---

## Recommended (not yet implemented)

Ideas surfaced during this audit that are real but out of the surgical scope of
E1/E3. Not built, not counted anywhere above as if they exist.

- **`source` param on `phone_click`** (§2.3) — would let call-tracking be
  broken down by placement (hero vs. header vs. service page vs. sticky bar)
  the same way `jane_outbound_click` already is via `source`.
- **`source` param threaded through `ServiceCard`** (§2.3) — would make
  `service_card_click` fully consistent across all its call sites.
- **UTM-aware page behavior for ICBC ads traffic** — ticket D1 calls for
  `?utm_medium=cpc` styling (nav-distraction-free variant); no code reads
  `utm_*` params today. GA4 itself doesn't need this to attribute traffic
  correctly (that happens automatically), but the on-page UX change described
  in D1 is unbuilt.
- **A Jane-side "how did you hear about us" / UTM passthrough field** — the
  single highest-leverage fix for the attribution gap in §3.3. Nothing in this
  repo can build it (Jane is a third-party booking system); flag for the owner
  as part of ticket E2/D2 setup conversations.
- **A `kt:conversion` listener** — the CustomEvent dispatched by every
  `trackEvent` call currently has no consumer. Could be wired to a second
  analytics provider later without touching any call site, since every surface
  already funnels through `trackEvent`.
