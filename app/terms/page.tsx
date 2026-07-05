import { PageHero } from "@/components/layout/PageHero";
import { Section, Container } from "@/components/layout/Section";
import { clinic } from "@/lib/site-data";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms of Use | Kinetic Therapy Clinic",
  description: "Terms governing the use of the Kinetic Therapy Clinic website.",
  path: "/terms",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Terms", path: "/terms" },
];

export default function TermsPage() {
  return (
    <>
      <PageHero title="Terms of Use" crumbs={crumbs} />
      <Section tone="white">
        <Container className="max-w-3xl space-y-5 text-[17px] leading-relaxed text-charcoal/80">
          {/* TODO(legal): Replace with the clinic's reviewed terms of use. */}
          <p className="rounded-2xl bg-sage/40 p-4 text-sm text-charcoal/70">
            This is a placeholder. Please replace it with your clinic&apos;s reviewed terms
            of use before launch.
          </p>
          <p>
            The content on this website is provided by {clinic.name} for general information
            only and is not a substitute for professional medical advice, diagnosis, or
            treatment. Always seek the advice of a qualified health provider with any
            questions about a medical condition.
          </p>
          <p>
            Information about services, insurance, and coverage is provided in good faith but
            may change. Coverage and eligibility can vary — please confirm details with the
            clinic and your insurer.
          </p>
        </Container>
      </Section>
    </>
  );
}
