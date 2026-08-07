# Website data-processing brief — for legal review

**Prepared for:** legal counsel advising Kinetic Therapy Clinic (Maple Ridge, BC)
**Subject:** personal information collected and transmitted by the clinic's public website
**Status:** factual technical description, prepared by the website developer

> **This is not legal advice and makes no compliance determinations.** It is a description
> of what the website actually does, written so counsel can decide what is required and
> draft the necessary documents. Every statement below about system behaviour was verified
> against the source code; statements about third-party vendors' internal practices are
> explicitly marked as unverified and need to be confirmed against those vendors' own terms.

---

## 1. What we are asking for

The website is built and functioning, but two things are deliberately unfinished pending
legal input:

1. **A privacy policy and terms of use.** A working draft of both exists on the site
   (`/privacy-policy`, `/terms`), written by the developer and clearly labelled as a draft
   requiring legal review. It has not been reviewed by a lawyer and should be treated as a
   starting point or discarded entirely, at your discretion.
2. **Consent language and consent mechanics.** The site currently collects health
   information and transmits it to third-party service providers, with a short notice on the
   intake page but no explicit consent step. We need to know what consent is required, at
   what point, and in what form.

Specific open questions are collected in §8.

---

## 2. The business and the site

Kinetic Therapy Clinic is a private multidisciplinary physiotherapy clinic in Maple Ridge,
British Columbia, offering physiotherapy, massage therapy, chiropractic, kinesiology,
acupuncture and related services, including treatment of ICBC and WorkSafeBC claims.

The website is a marketing and intake site. It does **not** contain a patient portal, user
accounts, login, payment processing, or clinical records. Booking is handled by a separate
third-party system (Jane App), reached by outbound link.

Relevant statutes we assume are in scope, **for counsel to confirm**: BC's *Personal
Information Protection Act* (PIPA), possibly the federal *PIPEDA*, professional obligations
of the regulated health professionals practising at the clinic, and *CASL* if the clinic
later sends commercial electronic messages. We have made no determination as to which apply.

---

## 3. What the website collects

Four forms collect personal information. There is no other collection mechanism — no
cookies set by the site itself, no account creation, no file uploads.

### 3.1 Contact form (`/contact`)

| Field | Required | Notes |
|---|---|---|
| Name | Yes | |
| Email | Yes | |
| Phone | No | |
| Category | Yes | Fixed list: Booking, Request a callback, Inquiry, ICBC, WSBC, Complaint, Other |
| Preferred callback time | No | |
| Message | Yes | Free text, up to 4,000 characters |

The free-text message field is unconstrained. Visitors can and do describe medical
complaints in it, so it should be assumed to contain health information.

### 3.2 Pre-visit intake form (`/intake`)

This is the most sensitive surface on the site. It collects:

| Field | Required | Category |
|---|---|---|
| First name, last name | Yes | Identity |
| Email | Yes | Contact |
| Phone | No | Contact |
| Reason for visit | Yes | Health — category, e.g. "Car accident (ICBC)" |
| Main concern | Yes | Health — free text |
| When it started | No | Health — free text |
| What makes it better/worse | No | Health — free text |
| Pain level (0–10) | No | Health |
| Goals for treatment | No | Health — free text |
| ICBC claim number | No | Insurance identifier |

### 3.3 ICBC callback form (`/icbc-claims`)

Name (required), phone (required), email (optional), ICBC claim number (optional),
preferred callback time (optional), free-text note (optional). This page is used as a
landing page for paid advertising.

### 3.4 Private feedback form (`/review`)

Name (optional), email (optional), free-text feedback (required). Designed to be usable
anonymously. A separate, clearly-labelled button links out to Google Reviews; the site does
not gate or filter which visitors are shown that option.

### 3.5 AI booking assistant (chat widget, site-wide)

An optional chat widget where visitors type free-text questions about which service to
book. There are no structured fields, but visitors routinely describe symptoms. Assume the
content is health information.

---

## 4. Where the information goes

The clinic's website acts as a conduit. **No submitted information is stored in any
database — the site has no database.** Each submission is transmitted and then exists only
in the recipients' systems.

### 4.1 Web3Forms — email delivery (all four forms)

Every form submission is relayed through Web3Forms, which formats it as an email and
delivers it to the clinic's inbox. Web3Forms therefore receives **the complete submission,
including all identity fields and all health free-text**, for every form.

For the intake form specifically, the email body contains both the AI-generated summary and
the complete raw answers as submitted.

*Unverified and requires review:* Web3Forms' corporate location, data residency, retention
period, sub-processors, and whether a data processing agreement is available or has been
executed. We have not reviewed their terms.

### 4.2 Anthropic — AI processing (intake form and chat assistant)

Two features send text to Anthropic's API:

**Intake summarization.** When a patient completes the intake form, the *health fields only*
are sent to Anthropic to generate a plain-language summary for clinic staff. Specifically
sent: reason for visit, main concern, onset, aggravating/easing factors, pain level, goals,
and ICBC claim number.

**Name, email and phone are deliberately not sent to Anthropic.** This was a data
minimization decision in the code. Note two caveats counsel should weigh:
- The free-text fields could contain identifying details if a patient types them.
- The ICBC claim number *is* currently sent. This is an identifier and arguably should not
  be. It is a one-line change to exclude it — please advise.

**Chat assistant.** The visitor's typed messages are sent to Anthropic to generate replies.
Whatever the visitor types is transmitted.

Anthropic is a US company and processing occurs outside Canada.

*Unverified and requires review:* Anthropic's retention period for API inputs, whether
inputs are used for model training, availability of a zero-retention or business-tier
agreement, and their standard commercial terms. These should be confirmed from Anthropic's
own documentation rather than from this brief.

### 4.3 Google Analytics 4 — usage measurement (optional, currently configurable)

If enabled, GA4 records page views and a set of interaction events. IP anonymization is
switched on in our configuration.

The events recorded are interaction signals only — for example that a phone number was
clicked, that a form was submitted, or which service card was clicked. **No form field
contents, and no health information, are sent to Google.** Event names include:
`contact_submit`, `intake_submit`, `icbc_callback_submit`, `phone_click`,
`concierge_open`, `service_card_click`, `pain_point_click`, `review_google_click`.

Note `pain_point_click` records which symptom category a visitor clicked on the homepage
(e.g. "back pain"). This is a coarse interest signal tied to a Google analytics identifier
rather than a name, but counsel may still consider it health-adjacent.

GA4 is only active if the clinic configures a measurement ID. **Please confirm with the
clinic whether analytics is switched on**, as it changes the disclosure required.

### 4.4 Jane App — booking (outbound link only)

"Book now" buttons link out to the clinic's Jane App booking site. No patient information
passes through our website to Jane; the visitor leaves and interacts with Jane directly.
Jane is presumably already covered by the clinic's existing arrangements, but the website's
privacy policy may still need to address the handoff.

### 4.5 Vercel — hosting

The site is hosted on Vercel. Vercel processes request metadata inherent to serving a
website — IP addresses, timestamps, user agents — in its platform logs.

### 4.6 Upstash — abuse prevention (optional, not currently enabled)

If enabled, a Redis service stores short-lived counters to limit how many times a single IP
address can submit a form. It stores **an IP address and a count**, expiring automatically
within an hour. No submission content is stored.

---

## 5. What the site deliberately does *not* do

These may be useful in framing the policy, and were explicit engineering decisions:

- **No database and no persistent storage of submissions.** Nothing a visitor types is
  retained by the website after transmission.
- **No accounts, logins, or patient portal.**
- **No payment processing.**
- **No advertising or marketing tracking pixels.** No Meta pixel, no Google Ads remarketing
  tag, no third-party advertising cookies. GA4 is the only analytics tool.
- **No cookies set by the website itself.** Any cookies present come from GA4, if enabled.
- **Application logs exclude personal information by design.** Server-side error logging was
  written to record only error types and HTTP status codes — never message bodies, intake
  answers, claim numbers, email addresses, or IP addresses.
- **Emergency screening.** Free-text health input is scanned by deterministic keyword rules
  for emergency indicators (cardiac, stroke, breathing, self-harm and similar). When one
  matches, the site stops and directs the visitor to call 911 or a crisis line instead of
  offering a booking. This runs in our own code; the matched text is never logged. Counsel
  may wish to consider how this is characterised — it is a safety redirect, explicitly not
  triage or medical advice.

---

## 6. Security measures in place

Summarised because they may be relevant to a "reasonable safeguards" analysis:

- All traffic served over HTTPS with HSTS.
- API credentials held server-side only; never exposed to the browser.
- Per-form server-side validation; submissions from undeclared sources rejected.
- Rate limiting on all form endpoints to limit automated abuse.
- Origin checks on state-changing requests, and request size limits.
- A Content-Security-Policy and related browser hardening headers.
- Dependency vulnerability scanning in continuous integration, currently reporting zero
  known vulnerabilities.
- The pre-visit intake page is excluded from search engine indexing.

---

## 7. Current notice given to visitors

At present the intake page displays this text above the form:

> "This form is for pre-visit planning only — it isn't monitored for urgent messages. If you
> have severe or worsening symptoms, chest pain, or numbness, call 911 or your doctor. Your
> answers are used to prepare for your visit, summarized with AI assistance, and delivered
> securely to our clinic team — see our Privacy Policy."

There is no separate consent checkbox on any form, and no consent step before the chat
assistant is used. The other three forms display no privacy notice at the point of
collection.

---

## 8. Questions for counsel

Ordered roughly by how much they affect the build.

**Consent**

1. Is express consent required before health information is submitted through the intake
   form, or is the current notice sufficient as deemed consent? If express consent is
   required, at what point and in what wording?
2. Does the AI chat assistant require its own consent or disclosure before a visitor's first
   message, given visitors volunteer symptoms unprompted?
3. Does the use of AI to summarise a patient's health answers require specific disclosure,
   separate from the general privacy notice?
4. Are there additional requirements arising from the professional obligations of the
   regulated practitioners at the clinic, beyond PIPA?

**Cross-border transfer**

5. Health information is transmitted to US-based processors (Anthropic, and Web3Forms
   subject to confirmation of its location). What notice or consent does this require, and
   does it change the analysis that the data is health information?
6. Is a data processing agreement with any of these vendors necessary, and should the clinic
   be seeking one before launch?

**Data minimization**

7. Should the ICBC claim number be excluded from what is sent to Anthropic? Our
   recommendation is yes; it is a small code change and we will make it on your advice.
8. Is there information currently collected that should not be collected at all?

**Retention**

9. The website retains nothing, but submissions land in the clinic's email inbox and in
   vendors' systems. What retention and disposal policy should apply to health information
   received by email, and does the website's privacy policy need to state it?

**Analytics**

10. Does GA4 as configured require a cookie banner or consent mechanism in BC?
11. Is the `pain_point_click` event — recording which symptom category a visitor clicked —
    acceptable, or should it be removed?

**Documents**

12. What documents does the clinic need: privacy policy, terms of use, consent form,
    internal privacy policy, breach response plan, records-of-processing?
13. Is the existing draft policy a usable starting point, or should it be replaced?
14. Should the site name a Privacy Officer with contact details, and is that required?

**Other**

15. The `/review` page invites Google reviews and, separately, private feedback. Are there
    constraints on how the clinic solicits reviews?
16. Does anything on the site constitute health-care advertising subject to professional
    marketing restrictions?

---

## 9. What we need back to finish the work

To implement whatever counsel advises, the useful outputs are:

- Final privacy policy text, and final terms of use text.
- Exact consent wording, plus where each piece must appear and whether it needs an
  affirmative action (checkbox) or notice alone.
- A decision on the ICBC claim number question (§8.7).
- A decision on analytics and any cookie consent requirement (§8.10).
- Any required contact details — Privacy Officer name, address, complaint process.

Text can be supplied as plain prose. Implementation is straightforward once the wording is
settled.

---

## 10. Contact

Questions about anything technical in this document should go to the clinic, who can relay
them to the website developer. Where this brief marks something as unverified, please treat
it as genuinely unknown rather than assumed — particularly the third-party vendor terms in
§4.1 and §4.2, which should be read directly.
