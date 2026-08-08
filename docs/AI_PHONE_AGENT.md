# After-Hours AI Phone Agent — Implementation Guide

Clinics lose bookings to unanswered calls. The website now captures part of this with
the **"Request a callback"** option on the contact form (category + best-time-to-call,
delivered to the clinic inbox). A true after-hours **voice** agent needs accounts and
phone-number provisioning that only the clinic owner can open — this guide is the
exact path when you're ready.

## What it would do

- Answer calls after hours (or on missed-call overflow during hours)
- Answer common questions (hours, address, parking, direct billing basics) from a
  script grounded in verified clinic info — never medical advice
- Take a structured callback request (name, number, reason, best time) and email it
  to the clinic inbox — same destination as the website forms
- Optionally: real-time booking by connecting to Jane (requires Jane API access —
  ask Jane support about API availability for your plan)

## Recommended options (easiest first)

| Option | What it is | Effort | Notes |
|---|---|---|---|
| **Voice-agent platform** (Vapi, Retell AI, Bland) | Hosted voice AI: you write the prompt, they handle telephony + speech | Low | Fastest path. Works with OpenAI or Anthropic model options. Per-minute pricing. Point your phone system's no-answer forwarding at the number they give you. |
| **Twilio + an LLM** | Build it yourself: Twilio Voice streams audio, your server runs speech-to-text → an LLM (the website uses OpenAI — see `lib/concierge.ts`) → text-to-speech | High | Full control, more maintenance. Only worth it if you want deep custom behavior. |
| **Simple voicemail-to-summary** | Keep voicemail; a small job transcribes new voicemails and emails an AI summary + callback priority to the front desk | Low | No live conversation, but captures every missed call with zero caller-experience risk. |

## Guardrails to configure (non-negotiable)

Use the same rules as the website concierge (`lib/concierge.ts`):
- No medical advice or diagnosis; "our practitioner will assess"
- No coverage/ICBC guarantees; "coverage and eligibility can vary"
- Emergency symptoms → advise 911/urgent care immediately
- Identify as an automated assistant at the start of the call
- Log/record only with clear disclosure, per BC PIPA requirements

## What the owner needs to provide

1. A platform account (Vapi/Retell/Bland or Twilio) and payment method
2. A forwarding rule from the clinic line (no-answer / after-hours → agent number)
3. Verified answers for the FAQ script (hours, parking, billing wording)
4. The destination inbox for callback requests (same as Web3Forms inbox works)

When you have the account, the website's content files (`content/site-content.json`)
already contain the grounding data the agent prompt needs.
