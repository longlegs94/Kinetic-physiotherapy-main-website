import { Hero } from "@/components/sections/Hero";
import { PainPointSection } from "@/components/sections/PainPointSection";
import { ServicesOverview } from "@/components/sections/ServicesOverview";
import { ICBCSection } from "@/components/sections/ICBCSection";
import { MultidisciplinaryAdvantage } from "@/components/sections/MultidisciplinaryAdvantage";
import { FeaturedPractitioners } from "@/components/sections/FeaturedPractitioners";
import { ClinicExperience } from "@/components/sections/ClinicExperience";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { JsonLd } from "@/components/ui/JsonLd";
import { faqSchema } from "@/lib/schema";
import { faqs } from "@/lib/site-data";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title:
    "Kinetic Therapy Clinic Maple Ridge | Physio, Massage, Chiro, Kinesiology & Acupuncture",
  description:
    "Kinetic Therapy is a multidisciplinary clinic in Maple Ridge offering physiotherapy, massage therapy, chiropractic, kinesiology, acupuncture, ICBC support, and recovery-focused care.",
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <JsonLd data={faqSchema(faqs)} />
      <Hero />
      <PainPointSection />
      <ServicesOverview />
      <ICBCSection />
      <MultidisciplinaryAdvantage />
      <FeaturedPractitioners />
      <ClinicExperience />
      <TestimonialsSection />
      <FAQSection faqs={faqs} />
      <FinalCTA />
    </>
  );
}
