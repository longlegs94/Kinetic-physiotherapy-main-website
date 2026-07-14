import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PostMeta } from "@/lib/blog";
import { Section, Container } from "@/components/layout/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BlogCard } from "@/components/cards/BlogCard";
import { StaggeredGrid, ScrollItem } from "@/components/motion/StaggeredGrid";

/**
 * "Related reading" module for service pages — up to 3 blog posts relevant
 * to the current service. Only ever surfaces published posts: even though
 * callers should already pass published-only posts (see lib/related.ts),
 * this filters defensively so a draft can never leak onto a live page.
 * Renders nothing if there's no relevant published post.
 */
export function RelatedReading({
  posts,
  title = "Worth a read before you book.",
  eyebrow = "Related reading",
}: {
  posts: PostMeta[];
  title?: string;
  eyebrow?: string;
}) {
  const published = posts.filter((p) => !p.draft).slice(0, 3);
  if (published.length === 0) return null;

  return (
    <Section tone="sage">
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} />
        <StaggeredGrid className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {published.map((post) => (
            <ScrollItem key={post.slug} as="div" className="h-full">
              <BlogCard post={post} />
            </ScrollItem>
          ))}
        </StaggeredGrid>
        <div className="mt-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-deep-teal hover:text-charcoal"
          >
            View all resources
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </Container>
    </Section>
  );
}
