import { PageHero } from "@/components/layout/PageHero";
import { Section, Container } from "@/components/layout/Section";
import { BlogCard } from "@/components/cards/BlogCard";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { StaggeredGrid, ScrollItem } from "@/components/motion/StaggeredGrid";
import { JsonLd } from "@/components/ui/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { getAllPosts } from "@/lib/blog";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Resources & Blog | Recovery, Injury & Wellness | Kinetic Therapy",
  description:
    "Practical guides on physiotherapy, massage, ICBC recovery, active rehab, and pain management in Maple Ridge from the team at Kinetic Therapy Clinic.",
  path: "/blog",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Resources", path: "/blog" },
];

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <PageHero
        title="Resources for your recovery."
        subtitle="Guides and answers on injury recovery, ICBC treatment, active rehab, massage, and managing pain — written to help you make confident decisions about your care."
        crumbs={crumbs}
      />

      <Section tone="white">
        <Container>
          {posts.length === 0 ? (
            <p className="text-center text-lg text-charcoal/70">
              New articles are on the way. Check back soon.
            </p>
          ) : (
            <StaggeredGrid className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <ScrollItem key={post.slug} as="div" className="h-full">
                  <BlogCard post={post} />
                </ScrollItem>
              ))}
            </StaggeredGrid>
          )}
        </Container>
      </Section>

      <FinalCTA source="blog_final" />
    </>
  );
}
