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
import { buildPageMetadata } from "@/lib/seo";

export const generateMetadata = () => buildPageMetadata({
  title:
    "{brand} Maple Ridge | Physio, Massage, Chiro, Kinesiology & Acupuncture",
  description:
    "{brand} is a multidisciplinary clinic in Maple Ridge offering physiotherapy, massage therapy, chiropractic, kinesiology, acupuncture, ICBC support, and recovery-focused care.",
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
