import { PageHero } from "@/components/layout/PageHero";
import { Section, Container } from "@/components/layout/Section";
import { pageMetadata } from "@/lib/seo";
import { getClinic, telHref, mailHref } from "@/lib/content/store";

export const metadata = pageMetadata({
  title: "Privacy Policy | Kinetic Therapy Clinic",
  description:
    "How Kinetic Therapy Clinic collects, uses, discloses, and protects personal information — including health information submitted through our contact, intake, and AI assistant forms — under BC's Personal Information Protection Act.",
  path: "/privacy-policy",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Privacy Policy", path: "/privacy-policy" },
];

export default async function PrivacyPolicyPage() {
  const clinic = await getClinic();
  const phoneHref = telHref(clinic.phone);
  const emailHref = mailHref(clinic.email);
  return (
    <>
      <PageHero title="Privacy Policy" crumbs={crumbs} />
      <Section tone="white">
        <Container className="max-w-3xl space-y-5 text-[17px] leading-relaxed text-charcoal/80">
          <p className="italic text-charcoal/60">
            This document is a working draft prepared for the clinic and should be reviewed
            by a legal professional before launch.
          </p>

          <p className="text-sm text-charcoal/60">Last updated: July 8, 2026</p>

          <p>
            {clinic.name} (&quot;we,&quot; &quot;us,&quot; &quot;our,&quot; or &quot;the
            clinic&quot;) respects your privacy and is committed to protecting the personal
            information — including personal health information — that you share with us. As
            a private-sector organization operating in British Columbia, we collect, use, and
            disclose personal information in accordance with BC&apos;s{" "}
            <em>Personal Information Protection Act</em> (PIPA) and, where applicable, the
            federal <em>Personal Information Protection and Electronic Documents Act</em>{" "}
            (PIPEDA). {clinic.name} is the organization responsible for the personal
            information described in this policy. This policy explains what information this
            website collects, how it is used, who it may be shared with, and what choices and
            rights you have.
          </p>

          <h2 className="text-xl font-bold text-charcoal">Information we collect</h2>
          <p>This website collects personal information — including health information you
            choose to share — in a few specific places:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Contact form.</strong> Your first and last name, email address, phone
              number, the reason for your enquiry (e.g. booking, callback request, ICBC,
              WSBC, complaint), a preferred callback time if applicable, and any message you
              write.
            </li>
            <li>
              <strong>Pre-visit intake form.</strong> Your name and optional email/phone,
              along with patient-reported health details you choose to provide: the reason
              for your visit, your main concern, when it started, what makes it better or
              worse, a self-reported pain level, your recovery goals, and an ICBC claim
              number if relevant. You are asked to confirm you understand this information is
              being sent to the clinic before it is submitted.
            </li>
            <li>
              <strong>AI assistant conversations.</strong> If you use the on-site AI
              assistant (booking concierge or symptom-guidance chat), the messages you type
              are collected so the assistant can generate a relevant reply and, where
              applicable, suggest services.
            </li>
            <li>
              <strong>Callback requests.</strong> If you ask us to call you back through the
              contact form, we collect the contact details and preferred time you provide for
              that purpose.
            </li>
            <li>
              <strong>Analytics data.</strong> If Google Analytics is enabled on this site, we
              collect standard, aggregated usage data (such as pages viewed and general
              interactions) with IP addresses anonymized. This is not tied to your name or
              health information.
            </li>
          </ul>
          <p>
            We do not require you to create an account to use this website, and this website
            does not process payments directly — payment happens in person at the clinic or
            through your booking with our scheduling provider.
          </p>

          <h2 className="text-xl font-bold text-charcoal">How we use your information</h2>
          <p>
            We use the information you submit only for the purpose you provided it: to
            respond to your enquiry, prepare for your appointment, provide the requested
            information through the AI assistant, or return your call. Pre-visit intake
            answers — together with any AI-drafted summary — are delivered to our clinic team
            by email so your practitioner can review them before or during your visit. We do
            not use the information you submit for marketing email lists, and we do not sell
            your personal information.
          </p>

          <h2 className="text-xl font-bold text-charcoal">Who your information may be shared with</h2>
          <p>
            We use a small number of third-party service providers to operate this website.
            Each processes information only as needed to provide their service to us:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Jane App</strong> — our online booking platform. When you book an
              appointment, you leave this website and book directly through Jane, which
              collects and handles your information under its own privacy policy. We
              encourage you to review it before booking.
            </li>
            <li>
              <strong>Web3Forms</strong> — a form-delivery service that relays contact form
              and pre-visit intake submissions from this website to our clinic email inbox. It
              acts as a delivery relay and does not use your information for its own
              purposes.
            </li>
            <li>
              <strong>OpenAI</strong> — the provider of the AI model behind our AI assistant
              and pre-visit summary tool. Messages you send to the assistant, and the
              answers you enter in the intake form, are sent to OpenAI&apos;s API to
              generate a reply or summary. Under OpenAI&apos;s API terms, this data is not
              used to train OpenAI&apos;s models, and is retained for a limited period
              (OpenAI&apos;s stated default is up to 30 days) for abuse monitoring before
              being deleted.
            </li>
            <li>
              <strong>Google Analytics 4</strong> — used for aggregated website usage
              analytics, only when configured for this site. See &ldquo;Cookies and
              analytics&rdquo; below for opt-out information.
            </li>
            <li>
              <strong>Email</strong> — contact form and intake submissions are ultimately
              delivered to our clinic&apos;s email inbox so our team can respond.
            </li>
          </ul>
          <p>
            We do not sell personal information to third parties, and we do not share it for
            third-party marketing purposes. We may disclose information where required by
            law, such as in response to a valid legal request.
          </p>

          <h2 className="text-xl font-bold text-charcoal">About the AI assistant</h2>
          <p>
            The AI assistant on this site (used for booking guidance and general
            symptom-related questions, and to draft your pre-visit summary) is an automated
            tool, not a medical record system and not a substitute for a conversation with
            your practitioner. Please avoid sharing more personal or health detail than
            necessary to get a helpful answer or a useful summary. Anything you tell the
            assistant that is relevant to your care should also be discussed directly with
            your practitioner, since the assistant&apos;s output is not stored as part of
            your clinical chart — pre-visit intake summaries are simply emailed to the clinic
            for your practitioner&apos;s reference.
          </p>

          <h2 className="text-xl font-bold text-charcoal">Retention</h2>
          <p>
            We keep personal information submitted through this website only for as long as
            needed to fulfil the purpose it was collected for, or as required by applicable
            professional, regulatory, or legal record-keeping obligations, after which it is
            deleted or securely destroyed.
          </p>

          <h2 className="text-xl font-bold text-charcoal">Cookies and analytics</h2>
          <p>
            If Google Analytics is enabled on this site, it may use cookies or similar
            technologies to collect anonymized, aggregated information about how visitors use
            the site, with IP addresses anonymized. You can opt out of Google Analytics
            tracking generally by installing the{" "}
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              className="text-deep-teal underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Analytics opt-out browser add-on
            </a>{" "}
            or by adjusting your browser&apos;s cookie and tracking settings.
          </p>

          <h2 className="text-xl font-bold text-charcoal">Your rights under PIPA</h2>
          <p>Under BC&apos;s Personal Information Protection Act, you have the right to:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Ask what personal information we hold about you and request access to it.</li>
            <li>Ask us to correct information you believe is inaccurate or incomplete.</li>
            <li>
              Withdraw consent to our collection, use, or disclosure of your personal
              information, subject to legal or contractual restrictions and reasonable
              notice.
            </li>
            <li>
              Make a complaint about how we handle your personal information to the
              clinic directly, or to the Office of the Information and Privacy Commissioner
              for British Columbia (OIPC) if you are not satisfied with our response.
            </li>
          </ul>
          <p>
            To exercise any of these rights, contact our privacy contact using the details
            below.
          </p>

          <h2 className="text-xl font-bold text-charcoal">Children&apos;s privacy</h2>
          <p>
            This website is not directed at children, and its forms are intended for use by
            patients or the adults booking or preparing for care on their behalf. If you
            believe a child has submitted personal information to us without appropriate
            consent, please contact us so we can address it.
          </p>

          <h2 className="text-xl font-bold text-charcoal">Changes to this policy</h2>
          <p>
            We may update this policy from time to time to reflect changes in our practices
            or legal requirements. The &ldquo;Last updated&rdquo; date at the top of this page
            shows when it was last revised.
          </p>

          <h2 className="text-xl font-bold text-charcoal">Privacy contact</h2>
          <p>
            Questions, requests, or complaints about this policy or how your personal
            information is handled can be directed to our privacy contact at{" "}
            <a href={emailHref} className="text-deep-teal underline underline-offset-2">
              {clinic.email}
            </a>{" "}
            or{" "}
            <a href={phoneHref} className="text-deep-teal underline underline-offset-2">
              {clinic.phone}
            </a>
            , or by mail to {clinic.address}.
          </p>
        </Container>
      </Section>
    </>
  );
}
