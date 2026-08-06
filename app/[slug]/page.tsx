import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  services,
  getService,
  resolveRelated,
  getPractitionersForService,
  faqs as globalFaqs,
} from "@/lib/site-data";
import { pageMetadata } from "@/lib/seo";
import { Section, Container } from "@/components/layout/Section";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BookButton } from "@/components/ui/BookButton";
import { CallButton } from "@/components/ui/CallButton";
import { TrustBadges } from "@/components/ui/TrustBadges";
import { ServiceCard } from "@/components/cards/ServiceCard";
import { PractitionerCard } from "@/components/cards/PractitionerCard";
import { FAQSection } from "@/components/sections/FAQSection";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { RelatedReading } from "@/components/sections/RelatedReading";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { StaggeredGrid, ScrollItem } from "@/components/motion/StaggeredGrid";
import { JsonLd } from "@/components/ui/JsonLd";
import { serviceSchema, breadcrumbSchema, faqSchema } from "@/lib/schema";
import { getRelatedPostsForService } from "@/lib/related";

export const dynamicParams = false;

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

const titleMap: Record<string, string> = {
  "physiotherapy-maple-ridge": "Physiotherapy Maple Ridge | Kinetic Therapy Clinic",
  "massage-therapy-maple-ridge":
    "Massage Therapy Maple Ridge | RMT & Therapeutic Massage | Kinetic Therapy",
  "chiropractor-maple-ridge":
    "Chiropractor Maple Ridge | Chiropractic Care | Kinetic Therapy",
  "icbc-physio-maple-ridge":
    "ICBC Physiotherapy Maple Ridge | Accident Recovery | Kinetic Therapy",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};
  return pageMetadata({
    title: titleMap[slug] ?? `${service.name} Maple Ridge | Kinetic Therapy Clinic`,
    description: service.heroSubtitle,
    path: `/${slug}`,
  });
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const related = resolveRelated(service.relatedServices);
  const relatedPosts = getRelatedPostsForService(slug);
  const relevantPractitioners = getPractitionersForService(service);

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: service.name, path: `/${slug}` },
  ];

  const pageFaqs = service.faqs && service.faqs.length > 0 ? service.faqs : globalFaqs;

  return (
    <>
      <JsonLd
        data={[serviceSchema(service), breadcrumbSchema(crumbs), faqSchema(pageFaqs)]}
      />

      <PageHero
        title={service.heroTitle}
        subtitle={service.heroSubtitle}
        crumbs={crumbs}
        actions={
          <>
            <BookButton label={service.ctaLabel} size="lg" withIcon source={`service:${slug}`} />
            <CallButton variant="secondary" size="lg" />
          </>
        }
      >
        <div className="mt-8">
          <TrustBadges />
        </div>
      </PageHero>

      {/* What this helps with */}
      <Section tone="white">
        <Container>
          <SectionHeading eyebrow="What we can help with" title="Is this right for you?">
            {service.name} may support a range of concerns. Your practitioner will assess
            your needs and recommend an appropriate plan.
          </SectionHeading>
          <StaggeredGrid className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {service.conditions.map((c) => (
              <ScrollItem
                key={c}
                as="div"
                className="flex items-center gap-3 rounded-2xl border border-silver/60 bg-white p-4 shadow-card"
              >
                <Check className="h-5 w-5 shrink-0 text-deep-teal" aria-hidden="true" />
                <span className="font-medium text-charcoal">{c}</span>
              </ScrollItem>
            ))}
          </StaggeredGrid>
        </Container>
      </Section>

      {/* What to expect */}
      <Section tone="warm">
        <Container>
          <SectionHeading eyebrow="What to expect" title="Your visit, step by step." />
          <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {service.process.map((step, i) => (
              <ScrollReveal
                key={step}
                as="li"
                delay={i * 0.05}
                className="rounded-card border border-silver/60 bg-white p-6 shadow-card"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-mint font-heading font-bold text-charcoal">
                  {i + 1}
                </span>
                <p className="mt-4 font-semibold text-charcoal">{step}</p>
              </ScrollReveal>
            ))}
          </ol>
        </Container>
      </Section>

      {/* Why Kinetic */}
      <Section tone="charcoal">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <SectionHeading
              eyebrow="Why Kinetic Therapy"
              tone="dark"
              title="Connected care, all in one place."
            >
              Because our physiotherapists, RMTs, chiropractor, kinesiologist, and
              acupuncturist work under one roof, your {service.shortName.toLowerCase()} care
              can be coordinated with other treatments when helpful — so your recovery feels
              more connected and complete.
            </SectionHeading>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <BookButton label={service.ctaLabel} size="lg" withIcon source={`service_why:${slug}`} />
            </div>
          </div>
        </Container>
      </Section>

      {/* Related services */}
      {related.length > 0 && (
        <Section tone="white">
          <Container>
            <SectionHeading eyebrow="Related services" title="You might also consider" />
            <StaggeredGrid className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <ScrollItem key={r.slug} as="article" className="h-full">
                  <ServiceCard service={r} />
                </ScrollItem>
              ))}
            </StaggeredGrid>
            <div className="mt-8">
              <Link
                href="/services"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-deep-teal hover:text-charcoal"
              >
                View all services
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </Container>
        </Section>
      )}

      {/* Practitioner preview */}
      {relevantPractitioners.length > 0 && (
        <Section tone="warm">
          <Container>
            <SectionHeading eyebrow="Your team" title="Practitioners for this service." />
            <StaggeredGrid className="mt-10 grid grid-cols-1 items-start gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {relevantPractitioners.slice(0, 4).map((p) => (
                <ScrollItem key={p.name} as="div">
                  <PractitionerCard practitioner={p} />
                </ScrollItem>
              ))}
            </StaggeredGrid>
          </Container>
        </Section>
      )}

      <RelatedReading posts={relatedPosts} />

      <FAQSection faqs={pageFaqs} eyebrow="FAQ" title="Common questions." />

      <FinalCTA source={`service_final:${slug}`} />
    </>
  );
}
