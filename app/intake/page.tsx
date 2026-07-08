import Link from "next/link";
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
          <div className="mb-8 rounded-2xl border border-mint/50 bg-sage/40 p-4 text-sm leading-relaxed text-charcoal/75">
            This form is for pre-visit planning only — it isn&apos;t monitored for urgent
            messages. If you have severe or worsening symptoms, chest pain, or numbness,
            call 911 or your doctor. Your answers are used to prepare for your visit,
            summarized with AI assistance, and delivered securely to our clinic team — see
            our{" "}
            <Link
              href="/privacy-policy"
              className="font-semibold text-deep-teal underline underline-offset-2 hover:text-deep-teal/80"
            >
              Privacy Policy
            </Link>
            .
          </div>
          <IntakeForm />
        </Container>
      </Section>
    </>
  );
}
