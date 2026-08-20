import type { Metadata } from "next";
import { Section, Container } from "@/components/layout/Section";
import { ReviewOptions } from "./ReviewOptions";
import { pageMetadata } from "@/lib/seo";
import { getClinic, telHref } from "@/lib/content/store";

// Funnel page for SMS/email/QR follow-up after a visit — not meant to be
// found via organic search, so it's excluded from indexing.
export const metadata: Metadata = {
  ...pageMetadata({
    title: "Leave a Review | Kinetic Therapy Clinic Maple Ridge",
    description:
      "How was your visit to Kinetic Therapy Clinic? Leave a Google review or share private feedback with our team.",
    path: "/review",
  }),
  robots: { index: false, follow: false },
};

export default async function ReviewPage() {
  const clinic = await getClinic();
  const phoneHref = telHref(clinic.phone);
  return (
    <Section tone="warm" className="flex min-h-[70vh] items-center pt-32 md:pt-40">
      <Container className="max-w-2xl">
        <div className="text-center">
          <h1 className="text-page-h1 font-extrabold text-charcoal">How was your visit?</h1>
          <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-charcoal/70">
            We&apos;d love to hear from you — pick whichever feels right. Both options are
            equally welcome.
          </p>
        </div>

        <div className="mt-10">
          <ReviewOptions />
        </div>

        <p className="mt-8 text-center text-sm text-charcoal/50">
          Prefer to talk it through? Call us at{" "}
          <a href={phoneHref} className="font-semibold text-deep-teal hover:underline">
            {clinic.phone}
          </a>
          .
        </p>
      </Container>
    </Section>
  );
}
