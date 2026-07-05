import { PageHero } from "@/components/layout/PageHero";
import { Section, Container } from "@/components/layout/Section";
import { clinic, phoneHref, emailHref } from "@/lib/site-data";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy | Kinetic Therapy Clinic",
  description:
    "How Kinetic Therapy Clinic collects, uses, and protects personal information provided through this website.",
  path: "/privacy-policy",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Privacy Policy", path: "/privacy-policy" },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHero title="Privacy Policy" crumbs={crumbs} />
      <Section tone="white">
        <Container className="max-w-3xl space-y-5 text-[17px] leading-relaxed text-charcoal/80">
          {/* TODO(legal): Replace this placeholder with the clinic's reviewed privacy
              policy. Should reflect PIPA (BC) / PIPEDA obligations and how patient
              health information is handled. Have it reviewed before launch. */}
          <p className="rounded-2xl bg-sage/40 p-4 text-sm text-charcoal/70">
            This is a placeholder policy. Please replace it with your clinic&apos;s reviewed
            privacy policy before launch.
          </p>
          <p>
            {clinic.name} respects your privacy. This policy explains, in general terms, how
            information submitted through this website is handled.
          </p>
          <h2 className="text-xl font-bold text-charcoal">Information we collect</h2>
          <p>
            When you use our contact form, we collect the details you provide (such as your
            name, email, phone number, and message) so we can respond to your enquiry. Online
            bookings are handled through our third-party booking provider, Jane.
          </p>
          <h2 className="text-xl font-bold text-charcoal">How we use information</h2>
          <p>
            We use the information you provide only to respond to your enquiry and support
            your care. We do not sell your personal information.
          </p>
          <h2 className="text-xl font-bold text-charcoal">Contact</h2>
          <p>
            Questions about this policy? Contact us at{" "}
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
