# Site audit — 2026-07-31

Scheduled follow-up audit covering performance, accessibility, SEO, security,
content quality, and UX. Baseline: `typecheck`, `lint`, and `build` all passed
clean before this pass — no functional regressions to fix.

## Findings & actions

| Area | Finding | Action |
|---|---|---|
| Security (deps) | `npm audit` flagged 3 high-severity advisories (Next.js DoS/SSRF/cache-confusion, PostCSS XSS/path-traversal, sharp/libvips CVEs) | Applied `npm audit fix` (patch-level bumps within the existing `^15.5.20` range: Next 15.5.20→15.5.22, PostCSS→8.5.25, nanoid, brace-expansion). Build/lint/typecheck re-verified green. |
| Security (deps) | Full remediation requires Next.js 16, which only has canary/preview releases as of this audit — no stable release exists yet | **Not applied.** Moving a live business site onto a preview/canary framework build is a real-world risk call, not a safe unattended action. Recommend re-running `npm audit` after Next 16 ships stable. |
| Security (API) | `app/api/{concierge,contact,intake}` all have origin checks, dual-window rate limiting, input validation, and fail-closed env-gating — solid. `lib/rate-limit.ts` is documented as in-memory/per-instance (soft throttle only) and `isAllowedOrigin` intentionally allows requests with no `Origin` header, to avoid blocking server-to-server calls | **Not changed.** Both are intentional, documented tradeoffs from earlier hardening work, not oversights. Closing the gap fully means adding a shared rate-limit store (Upstash Redis / Vercel KV) — new paid infra, an owner decision, not something to wire in unattended. Flagging as a cost/abuse exposure specific to the two Anthropic-backed routes (concierge, intake) for the owner to weigh if usage grows. |
| Accessibility | Contact form, intake form, and `/review` feedback form all swap to a confirmation panel on success with no `aria-live`/`role="status"` — screen-reader users aren't told the submission succeeded (only error paths had `role="alert"`) | **Fixed.** Added `role="status" aria-live="polite"` to all three success panels (`components/cards/ContactForm.tsx`, `components/intake/IntakeForm.tsx`, `app/review/ReviewOptions.tsx`). |
| SEO | Sitemap, robots, and per-page metadata (canonical/OG/Twitter via `lib/seo.ts`) all correctly wired across every route checked, including the 4 location pages. `/review` and `/icbc-claims` are deliberately `noindex` and excluded from the sitemap (funnel/paid-landing pages) — confirmed intentional, not a bug | No action needed. |
| SEO / schema | `lib/schema.ts` still ships a `TODO(verify)` placeholder geo-coordinate pair into `LocalBusiness` JSON-LD | **Not changed** — owner-blocked per `VERIFY_BEFORE_LAUNCH.md` (needs the clinic's real coordinates). Flagging because it's live in production schema today, not just a code comment. |
| Content / internal linking (Phase 1 ticket C3) | `lib/related.ts` + `RelatedReading` is a genuine systematic module, not ad hoc, and location pages cross-link correctly. But 4 of 9 services have zero related posts; 3 resolve once matching draft posts publish (C2), but **`acupuncture-maple-ridge` has no post at all, draft or published** | **Not changed** — writing clinical content without medical review isn't a safe unattended action (same standard the repo already applies to the 7 pending blog drafts). Logged as a gap in `docs/PHASE1_TICKETS.md` (C3) for the next content pass. |
| Content quality | No lorem-ipsum or fabricated business facts found anywhere in the codebase | No action needed. |
| Practitioner data / badges | 13 practitioners + 4 trust badges (ICBC/WSBC/direct billing/evening hours) still flagged `needsVerification: true` in `content/site-content.json` | **Not changed** — owner-only per `PHASE1_TICKETS.md` A2. Confirmed still outstanding. |

## Not attempted

The originating task also asked to run agents to "build a fully functioning
business." That instruction wasn't actionable within this audit: it's
unbounded in scope, and several plausible interpretations (creating live
Shopify products/discounts, deploying infra, publishing unreviewed medical
content) involve real-world, hard-to-reverse business actions that shouldn't
be taken by an unattended scheduled run without the owner's explicit sign-off
per item. This pass stayed inside the repo, made only safe/reversible
changes, and left every owner-gated item (photos, roster, legal review, geo
coordinates, medical content) untouched and clearly flagged, consistent with
`docs/PHASE1_TICKETS.md`.
