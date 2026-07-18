# Review Request Campaign

Companion to `ROADMAP.md` Epic B (Google review flywheel) and `PHASE1_TICKETS.md`
ticket **B2**. Covers the copy for post-visit review requests and the Jane setup
steps to send them. The `/review` funnel page itself (ticket B1) and its footer/
contact-form CTAs (ticket B4) are already live — this doc is what points patients
at it.

## Compliance guardrails (read first)

- **No review gating.** `/review` always shows both options — leave a Google
  review, or send private feedback — with equal visual weight. Never ask
  "were you happy with your visit?" and route only "yes" to Google; that
  violates Google's review policies. The templates below follow this.
- **No incentives.** Don't offer a discount, draw entry, or anything of value
  for leaving a review — Google policy and, for regulated professions,
  advertising-standards risk.
- **CPTBC / CMTBC testimonial rules.** These templates only ever invite the
  patient to post on their own Google account, or send private feedback to the
  clinic. Nothing here quotes or republishes a review as marketing copy — if
  the clinic later wants to feature a review, get college-specific compliance
  guidance first (see `ROADMAP.md` §4 Phase 1 item 2).
- **Timing.** Send once per completed visit, not on every visit — repeated asks
  read as spammy and depress response rate.

## Before sending: one blocker

`app/review/ReviewOptions.tsx` currently falls back to a placeholder Google
review link:

```
NEXT_PUBLIC_GOOGLE_REVIEW_URL || "https://search.google.com/local/writereview?placeid=REPLACE_ME"
```

Set `NEXT_PUBLIC_GOOGLE_REVIEW_URL` to the clinic's real Google review link
(Google Business Profile → "Ask for reviews" → copy the short link, or build
`https://search.google.com/local/writereview?placeid=<place_id>` from the
Business Profile's place ID) before turning on any automated send — otherwise
the primary CTA on the page 404s.

## Templates

Each links to `/review` with the UTM tags from `docs/ANALYTICS.md` §4 so
opens are attributable in GA4. Swap `{first_name}` / practitioner name for
whatever merge fields Jane's notification templates support.

### Email (send ~2 hours after visit)

**Subject:** How was your visit today, {first_name}?

> Hi {first_name},
>
> Thanks for coming in today. We'd love to hear how it went — good or bad,
> your feedback helps us do better.
>
> **[Tell us about your visit →](https://www.kinetictherapyclinic.ca/review?utm_source=jane&utm_medium=email&utm_campaign=review-request)**
>
> It takes less than a minute, and there's no wrong answer — happy to hear a
> Google review, or a private note straight to our team, whichever feels
> right.
>
> See you again soon,
> The Kinetic Therapy Clinic team
> (604) 467-2113

### SMS (send ~2 hours after visit, if Jane SMS is enabled)

> Hi {first_name}, it's Kinetic Therapy Clinic. How was your visit today?
> Share feedback here: https://www.kinetictherapyclinic.ca/review?utm_source=jane&utm_medium=sms&utm_campaign=review-request
> Reply STOP to opt out.

### QR code / in-clinic card (checkout counter, treatment rooms)

Short URL for print/QR use — no PII, safe to laminate:

```
https://www.kinetictherapyclinic.ca/review?utm_source=qr&utm_medium=offline&utm_campaign=review-request
```

Suggested card copy:

> **How was your visit?**
> Scan to leave a Google review or send us private feedback — both welcome.

## Jane setup (owner action — ticket B2 `BOTH`)

1. In Jane, go to **Settings → Patient Communication → Automated Messages**
   (naming may vary by Jane plan).
2. Create a new automated message triggered on **appointment completed**,
   delayed **2 hours**.
3. Paste the email template above into the email variant; if SMS is enabled
   on the plan, add the SMS variant too.
4. Send a test to your own patient profile and confirm the link opens
   `/review` correctly and both buttons (Google review / private feedback)
   work.
5. Turn on for one practitioner first, confirm no complaints/unsubscribes in
   week 1, then expand clinic-wide.

## Tracking

`/review` already fires `review_feedback_submit` (GA4) when the private
feedback form is used. Add a GA4 **outbound click** check for the Google
review button (`GOOGLE_REVIEW_URL`) — confirm it's captured by GA4's
automatic outbound-link tracking, or add an explicit `trackEvent` call in
`ReviewOptions.tsx` if not. Target from `ROADMAP.md`: **+15 Google reviews /
month**, tracked monthly alongside the other KPIs in `ANALYTICS.md`.
