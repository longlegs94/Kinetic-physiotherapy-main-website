import { PageHero } from "@/components/layout/PageHero";
import { Section, Container } from "@/components/layout/Section";
import { IntakeForm } from "@/components/intake/IntakeForm";
import { JsonLd } from "@/components/ui/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Pre-Visit Intake | Kinetic Therapy Clinic Maple Ridge",
  description:
    "Get a head start on your first visit to Kinetic Therapy in Maple Ridge. Answer a few questions and we'll prepare a pre-visit summary for our team.",
  path: "/intake",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Pre-Visit Intake", path: "/intake" },
];

export default function IntakePage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <PageHero
        title="Get a head start on your first visit."
        subtitle="Answer a few questions and we'll prepare a summary for our team — so your appointment time goes to treatment, not paperwork."
        crumbs={crumbs}
      />
      <Section tone="white">
        <Container className="max-w-3xl">
          <p className="mb-8 text-sm leading-relaxed text-charcoal/60">
            Your answers are sent to our clinic team to prepare for your visit. This form
            is not medical advice and is not monitored for urgent needs — if you have
            urgent symptoms, call 911 or visit an emergency department.
          </p>
          <IntakeForm />
        </Container>
      </Section>
    </>
  );
}
