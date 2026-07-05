import { Section, Container } from "@/components/layout/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PractitionerCard } from "@/components/cards/PractitionerCard";
import { LinkButton } from "@/components/ui/Button";
import { StaggeredGrid, ScrollItem } from "@/components/motion/StaggeredGrid";
import { practitioners } from "@/lib/site-data";

export function FeaturedPractitioners() {
  const featured = practitioners.slice(0, 4);

  return (
    <Section tone="warm" id="team">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Meet the team"
            title="Meet the team behind your recovery."
          />
          <LinkButton href="/team" variant="secondary" className="hidden sm:inline-flex">
            Meet the full team
          </LinkButton>
        </div>

        <StaggeredGrid className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <ScrollItem key={p.name} as="div" className="h-full">
              <PractitionerCard practitioner={p} />
            </ScrollItem>
          ))}
        </StaggeredGrid>

        <div className="mt-8 sm:hidden">
          <LinkButton href="/team" variant="secondary" className="w-full">
            Meet the full team
          </LinkButton>
        </div>
      </Container>
    </Section>
  );
}
