import { HeartHandshake, Target, Users, Sparkles } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { Section, Container } from "@/components/layout/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { MultidisciplinaryAdvantage } from "@/components/sections/MultidisciplinaryAdvantage";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { StaggeredGrid, ScrollItem } from "@/components/motion/StaggeredGrid";
import { JsonLd } from "@/components/ui/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { buildPageMetadata } from "@/lib/seo";
import { BookButton } from "@/components/ui/BookButton";
import { getClinic } from "@/lib/content/store";

export const generateMetadata = () => buildPageMetadata({
  title: "About {brand} | Multidisciplinary Care in Maple Ridge",
  description:
    "{brand} is a modern multidisciplinary clinic in Maple Ridge bringing physiotherapy, massage, chiropractic, kinesiology, and acupuncture together for connected, whole-person care.",
  path: "/about",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
];

const values = [
  {
    icon: HeartHandshake,
    title: "Whole-person care",
    copy: "We look beyond a single symptom to support your movement, comfort, and long-term health.",
  },
  {
    icon: Target,
    title: "Clear, guided recovery",
    copy: "Assessment, a plan, and progress you can understand — care should never feel confusing.",
  },
  {
    icon: Users,
    title: "One connected team",
    copy: "Multiple disciplines under one roof means your practitioners can coordinate when it helps.",
  },
  {
    icon: Sparkles,
    title: "Calm, modern space",
    copy: "A welcoming, organized clinic designed to feel supportive from your very first visit.",
  },
];

export default async function AboutPage() {
  const clinic = await getClinic();
  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <PageHero
        title="Modern, connected care for pain, recovery, and movement."
        subtitle={clinic.positioning}
        crumbs={crumbs}
        actions={<BookButton label="Book an Appointment" size="lg" withIcon source="about_hero" />}
      />

      <Section tone="white">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <SectionHeading eyebrow="Our story" title="Recovery, organized around you.">
              {clinic.name} is a multidisciplinary clinic in {clinic.city} helping patients
              recover from pain, injury, accidents, and mobility limitations through connected
              hands-on care, movement rehab, and wellness services.
            </SectionHeading>
            <ScrollReveal className="space-y-4 text-lg leading-relaxed text-charcoal/75">
              <p>
                Instead of sending you between separate clinics, we bring physiotherapy,
                massage therapy, chiropractic, kinesiology, acupuncture, and more together in
                one place — so your care can feel more coordinated, convenient, and complete.
              </p>
              <p>
                Whether you&apos;re recovering from a car accident, managing chronic pain,
                rebuilding strength, or simply looking after your body, our goal is the same:
                help you move better, recover stronger, and live pain-free.
              </p>
              {/* TODO(content): expand with the clinic's real founding story / mission once
                  provided by the owner. Keep claims non-guaranteeing. */}
            </ScrollReveal>
          </div>
        </Container>
      </Section>

      <Section tone="warm">
        <Container>
          <SectionHeading eyebrow="What we value" title="How we approach your care." align="center" />
          <StaggeredGrid className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <ScrollItem
                key={v.title}
                as="div"
                className="rounded-card border border-silver/60 bg-white p-6 shadow-card"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sage/70 text-deep-teal">
                  <v.icon className="h-6 w-6" aria-hidden="true" strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 text-lg font-bold text-charcoal">{v.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-charcoal/70">{v.copy}</p>
              </ScrollItem>
            ))}
          </StaggeredGrid>
        </Container>
      </Section>

      <MultidisciplinaryAdvantage />

      <FinalCTA source="about_final" />
    </>
  );
}
