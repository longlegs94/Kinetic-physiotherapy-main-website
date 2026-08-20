import { PageHero } from "@/components/layout/PageHero";
import { Section, Container } from "@/components/layout/Section";
import { pageMetadata } from "@/lib/seo";
import { getClinic, telHref, mailHref } from "@/lib/content/store";

export const metadata = pageMetadata({
  title: "Terms of Use | Kinetic Therapy Clinic",
  description:
    "Terms governing the use of the Kinetic Therapy Clinic website, including the informational nature of its content, the AI assistant, third-party booking, and insurance disclaimers.",
  path: "/terms",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Terms", path: "/terms" },
];

export default async function TermsPage() {
  const clinic = await getClinic();
  const phoneHref = telHref(clinic.phone);
  const emailHref = mailHref(clinic.email);
  return (
    <>
      <PageHero title="Terms of Use" crumbs={crumbs} />
      <Section tone="white">
        <Container className="max-w-3xl space-y-5 text-[17px] leading-relaxed text-charcoal/80">
          <p className="italic text-charcoal/60">
            This document is a working draft prepared for the clinic and should be reviewed
            by a legal professional before launch.
          </p>

          <p className="text-sm text-charcoal/60">Last updated: July 8, 2026</p>

          <p>
            These terms govern your use of this website, operated by {clinic.name}. By using
            this website, you agree to these terms. If you do not agree, please do not use
            the site.
          </p>

          <h2 className="text-xl font-bold text-charcoal">Not medical advice</h2>
          <p>
            The content on this website — including service descriptions, blog articles,
            FAQs, and any output from the AI assistant — is provided by {clinic.name} for
            general informational purposes only. It is not medical advice, is not a diagnosis
            or treatment recommendation, and is not a substitute for an assessment by a
            qualified health provider. Using this website, including submitting the contact
            or pre-visit intake form or chatting with the AI assistant, does not create a
            practitioner-patient relationship. That relationship begins only once you have an
            in-person or clinically supervised appointment with one of our practitioners.
            Always seek the advice of a qualified health provider with any questions about a
            medical condition, and never disregard or delay seeking professional advice
            because of something you read or were told on this website.
          </p>

          <h2 className="text-xl font-bold text-charcoal">The AI assistant</h2>
          <p>
            This website includes an AI-powered assistant that can answer general questions,
            suggest relevant services, and help prepare a pre-visit summary from
            patient-reported information. The assistant provides general information only, is
            not a clinician, and can make mistakes or give incomplete or inaccurate answers.
            Do not rely on it for diagnosis, treatment decisions, or urgent medical concerns.
            If you are experiencing a medical emergency or urgent symptoms, call{" "}
            <strong>911</strong> or go to your nearest emergency department — the AI
            assistant and website forms are not monitored for urgent needs.
          </p>

          <h2 className="text-xl font-bold text-charcoal">Booking through Jane App</h2>
          <p>
            Appointment booking is handled through our third-party scheduling provider, Jane
            App. When you book an appointment, you leave this website and use Jane&apos;s
            platform under Jane&apos;s own terms of use and privacy policy, which we
            encourage you to review. We are not responsible for the availability or
            performance of Jane&apos;s platform.
          </p>

          <h2 className="text-xl font-bold text-charcoal">Insurance and coverage</h2>
          <p>
            Information about services, insurance, and coverage on this website — including
            references to ICBC, WSBC, or extended health benefits — is provided in good faith
            but may change and is not a guarantee of coverage or reimbursement. Eligibility,
            claim limits, and coverage terms are determined by your insurer or claim
            administrator and can vary by individual circumstances. Please confirm your
            specific coverage and eligibility with the clinic and your insurer before relying
            on any information provided here.
          </p>

          <h2 className="text-xl font-bold text-charcoal">Intellectual property</h2>
          <p>
            The text, graphics, logos, and other content on this website are owned by or
            licensed to {clinic.name} and are protected by copyright and other intellectual
            property laws. You may view and print content for your own personal,
            non-commercial use, but may not reproduce, distribute, or otherwise use it
            without our permission.
          </p>

          <h2 className="text-xl font-bold text-charcoal">Limitation of liability</h2>
          <p>
            This website and its content, including the AI assistant, are provided on an
            &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis, without warranties of
            any kind, express or implied. To the fullest extent permitted by law,{" "}
            {clinic.name} is not liable for any loss or damage arising from your use of, or
            inability to use, this website, or from your reliance on any information provided
            through it, including through the AI assistant.
          </p>

          <h2 className="text-xl font-bold text-charcoal">Governing law</h2>
          <p>
            These terms are governed by the laws of the Province of British Columbia and the
            federal laws of Canada applicable in it, without regard to conflict-of-law
            principles.
          </p>

          <h2 className="text-xl font-bold text-charcoal">Contact</h2>
          <p>
            Questions about these terms can be directed to{" "}
            <a href={emailHref} className="text-deep-teal underline underline-offset-2">
              {clinic.email}
            </a>{" "}
            or{" "}
            <a href={phoneHref} className="text-deep-teal underline underline-offset-2">
              {clinic.phone}
            </a>
            .
          </p>
        </Container>
      </Section>
    </>
  );
}
