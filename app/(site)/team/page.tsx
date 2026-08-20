import { PageHero } from "@/components/layout/PageHero";
import { Section, Container } from "@/components/layout/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PractitionerCard } from "@/components/cards/PractitionerCard";
import { NotSureCTA } from "@/components/ui/NotSureCTA";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { StaggeredGrid, ScrollItem } from "@/components/motion/StaggeredGrid";
import { JsonLd } from "@/components/ui/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";
import { BookButton } from "@/components/ui/BookButton";
import { getPractitioners } from "@/lib/content/store";

export const metadata = pageMetadata({
  title: "Our Team in Maple Ridge — Physiotherapists, RMTs & More | Kinetic Therapy Clinic",
  description:
    "Meet the multidisciplinary team at Kinetic Therapy Clinic in Maple Ridge — physiotherapists, registered massage therapists, kinesiologist, acupuncturist, and more, working together on your recovery.",
  path: "/team",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Our Team", path: "/team" },
];

/** Ordered disciplines; practitioners not matching fall into "Wellness & Support". */
const disciplineOrder = [
  "Physiotherapy",
  "Massage Therapy",
  "Kinesiology",
  "Acupuncture & TCM",
  "Naturotherapy and Lactation",
];

export default async function TeamPage() {
  const practitioners = await getPractitioners();
  const groups = disciplineOrder
    .map((category) => ({
      category,
      members: practitioners.filter((p) => p.category === category),
    }))
    .filter((g) => g.members.length > 0);

  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <PageHero
        title="Meet the team behind your recovery."
        subtitle="Our practitioners work under one roof so your care can be coordinated across disciplines when it helps — from first assessment to long-term recovery."
        crumbs={crumbs}
        actions={<BookButton label="Book an Appointment" size="lg" withIcon source="team_hero" />}
      />

      {groups.map((group, idx) => (
        <Section key={group.category} tone={idx % 2 === 0 ? "white" : "warm"}>
          <Container>
            <SectionHeading eyebrow="Our team" title={group.category} />
            <StaggeredGrid className="mt-8 grid grid-cols-1 items-start gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {group.members.map((p) => (
                <ScrollItem key={p.name} as="div">
                  <PractitionerCard practitioner={p} />
                </ScrollItem>
              ))}
            </StaggeredGrid>
          </Container>
        </Section>
      ))}

      <Section tone="sage">
        <Container className="flex flex-col items-center gap-6 text-center">
          <p className="max-w-xl text-lg font-medium text-charcoal/80">
            Not sure which practitioner is the right fit? Our team can help match you to the
            right starting point.
          </p>
          <NotSureCTA />
        </Container>
      </Section>

      <FinalCTA source="team_final" />
    </>
  );
}
