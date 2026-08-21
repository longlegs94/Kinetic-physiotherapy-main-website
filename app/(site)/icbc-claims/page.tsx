import type { Metadata } from "next";
import { Check, ShieldCheck, PhoneCall, CalendarClock, ClipboardCheck } from "lucide-react";
import { getService } from "@/lib/site-data";
import { buildPageMetadata } from "@/lib/seo";
import { Section, Container } from "@/components/layout/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BookButton } from "@/components/ui/BookButton";
import { CallButton } from "@/components/ui/CallButton";
import { TrustBadges } from "@/components/ui/TrustBadges";
import { IcbcCallbackForm } from "@/components/icbc/IcbcCallbackForm";
import { IcbcStickyBar } from "@/components/icbc/IcbcStickyBar";
import { TrackedCta } from "@/components/icbc/TrackedCta";
import { getClinic } from "@/lib/content/store";

// Dedicated paid-traffic landing page for "Injured in a car accident?" ads.
// Kept out of search results (robots: noindex,nofollow) and out of the
// sitemap so it never competes with the organic /icbc-physio-maple-ridge
// service page for the same queries.
export async function generateMetadata(): Promise<Metadata> {
  return {
    ...(await buildPageMetadata({
      title:
        "Injured in a Car Accident? ICBC Physiotherapy in Maple Ridge | {brand}",
      description:
        "Injured in a car accident? Our Maple Ridge team can help you understand your ICBC treatment options. Call now or request a callback — no obligation.",
      path: "/icbc-claims",
    })),
    robots: { index: false, follow: false },
  };
}

const service = getService("icbc-physio-maple-ridge");

const conditions = service?.conditions ?? [
  "Neck pain",
  "Back pain",
  "Whiplash-type symptoms",
  "Shoulder pain",
  "Headaches",
  "Reduced mobility",
  "General accident-related soreness",
];

const steps = [
  {
    icon: PhoneCall,
    title: "Call or request a callback",
    desc: "Reach our team directly, or leave your details below and we'll call you back.",
  },
  {
    icon: ClipboardCheck,
    title: "We help you understand your next steps",
    desc: "Our team can help you understand your options and get an assessment booked.",
  },
  {
    icon: CalendarClock,
    title: "Start your recovery plan",
    desc: "Your practitioner will assess your needs and recommend an appropriate plan.",
  },
];

const faqs =
  service?.faqs?.filter((f) =>
    [
      "How many treatment sessions does ICBC cover?",
      "What do I need to bring to my first ICBC appointment?",
      "Do I need a doctor's referral to start ICBC treatment?",
    ].includes(f.question)
  ) ?? [];

export default async function IcbcClaimsPage() {
  const clinic = await getClinic();
  return (
    <>
      {/* Hero: headline + phone-first CTA on the left, callback form on the right */}
      <section className="relative overflow-hidden bg-warm-white pt-28 pb-14 sm:pt-32 md:pt-36 md:pb-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-16 h-96 w-96 rounded-full bg-mint/15 blur-3xl"
        />
        <Container className="relative">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-14">
            <div>
              <span className="inline-block text-sm font-semibold uppercase tracking-[0.14em] text-deep-teal">
                ICBC Accident Recovery — Maple Ridge
              </span>
              <h1 className="mt-3 max-w-xl text-page-h1 font-extrabold text-charcoal">
                Injured in a car accident? ICBC physiotherapy in Maple Ridge.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-charcoal/70">
                If you were hurt in a motor vehicle accident, our team can help you
                understand your next steps and get started with care. Call now, or request
                a callback and we&apos;ll reach out to you.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <TrackedCta cta="hero_call">
                  <CallButton variant="primary" size="lg" />
                </TrackedCta>
                <TrackedCta cta="hero_callback">
                  <a
                    href="#callback-form"
                    className="inline-flex items-center justify-center gap-2 rounded-pill border border-charcoal/25 bg-transparent px-7 py-4 text-[17px] font-semibold text-charcoal transition-all duration-200 ease-premium hover:border-deep-teal hover:bg-sage/50"
                  >
                    <CalendarClock className="h-[18px] w-[18px]" aria-hidden="true" />
                    Request a Callback
                  </a>
                </TrackedCta>
              </div>

              <div className="mt-6">
                <TrustBadges />
              </div>

              <div className="mt-8 flex items-start gap-3 rounded-card border border-mint/50 bg-sage/40 p-5">
                <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-deep-teal" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-charcoal/80">
                  If you have an active ICBC claim, you may be able to access{" "}
                  <strong className="text-charcoal">up to 12 weeks of treatment</strong> —
                  such as physiotherapy, massage, kinesiology, chiropractic, and acupuncture
                  — though conditions and eligibility apply. Our team can help you
                  understand what applies to your specific claim.
                </p>
              </div>
            </div>

            <div>
              <IcbcCallbackForm />
            </div>
          </div>
        </Container>
      </section>

      {/* What happens next */}
      <Section tone="warm">
        <Container>
          <SectionHeading eyebrow="What happens next" title="Getting started is simple." />
          <ol className="mt-10 grid gap-5 sm:grid-cols-3">
            {steps.map((step, i) => (
              <li
                key={step.title}
                className="rounded-card border border-silver/60 bg-white p-6 shadow-card"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-mint font-heading font-bold text-charcoal">
                  {i + 1}
                </span>
                <p className="mt-4 font-semibold text-charcoal">{step.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-charcoal/65">{step.desc}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* Common symptoms */}
      <Section tone="white">
        <Container>
          <SectionHeading
            eyebrow="What we can help with"
            title="Common symptoms after a motor vehicle accident."
          >
            Your practitioner will assess your needs and recommend an appropriate plan.
          </SectionHeading>
          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {conditions.map((c) => (
              <div
                key={c}
                className="flex items-center gap-3 rounded-2xl border border-silver/60 bg-white p-4 shadow-card"
              >
                <Check className="h-5 w-5 shrink-0 text-deep-teal" aria-hidden="true" />
                <span className="font-medium text-charcoal">{c}</span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Objection-handling FAQ, kept short for a focused landing page */}
      {faqs.length > 0 && (
        <Section tone="warm">
          <Container>
            <SectionHeading eyebrow="Good to know" title="Common questions." />
            <div className="mt-10 grid gap-5 sm:grid-cols-3">
              {faqs.map((f) => (
                <div
                  key={f.question}
                  className="rounded-card border border-silver/60 bg-white p-6 shadow-card"
                >
                  <p className="font-semibold text-charcoal">{f.question}</p>
                  <p className="mt-2 text-sm leading-relaxed text-charcoal/65">{f.answer}</p>
                </div>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Closing CTA */}
      <Section tone="charcoal" className="relative overflow-hidden">
        <Container className="relative">
          <div className="glass-dark relative overflow-hidden rounded-panel px-6 py-14 text-center sm:px-14">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mint/20 blur-3xl"
            />
            <h2 className="relative mx-auto max-w-3xl text-section-h2 font-bold text-warm-white">
              Don&apos;t wait to start feeling better.
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-lg text-warm-white/75">
              Call our Maple Ridge clinic now, or request a callback and our team will help
              you understand your next steps.
            </p>
            <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <TrackedCta cta="final_call">
                <CallButton variant="secondary-dark" size="lg" />
              </TrackedCta>
              <TrackedCta cta="final_callback">
                <a
                  href="#callback-form"
                  className="inline-flex items-center justify-center gap-2 rounded-pill border border-white/40 bg-transparent px-7 py-4 text-[17px] font-semibold text-warm-white transition-all duration-200 ease-premium hover:border-mint hover:bg-white/10"
                >
                  <CalendarClock className="h-[18px] w-[18px]" aria-hidden="true" />
                  Request a Callback
                </a>
              </TrackedCta>
              <TrackedCta cta="final_book">
                <BookButton label="Book Online" size="lg" variant="secondary-dark" source="icbc_ads" />
              </TrackedCta>
            </div>
            <p className="relative mx-auto mt-6 max-w-xl text-xs text-warm-white/50">
              {clinic.address} · {clinic.phone}
            </p>
          </div>
        </Container>
      </Section>

      {/* Clearance so the sticky mobile bar never covers the footer content */}
      <div className="h-24 md:hidden" aria-hidden="true" />

      <IcbcStickyBar />
    </>
  );
}
