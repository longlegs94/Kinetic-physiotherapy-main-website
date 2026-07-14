import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { ArrowLeft, Clock } from "lucide-react";
import { getPost, getPublishedSlugs, showDrafts } from "@/lib/blog";
import { Section, Container } from "@/components/layout/Section";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ServiceCard } from "@/components/cards/ServiceCard";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { KineticMotionLine } from "@/components/motion/KineticMotionLine";
import { StaggeredGrid, ScrollItem } from "@/components/motion/StaggeredGrid";
import { JsonLd } from "@/components/ui/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { pageMetadata, SITE_URL, SITE_NAME } from "@/lib/seo";
import { clinic } from "@/lib/site-data";
import { mdxComponents } from "@/components/blog/MdxComponents";
import { getRelatedServicesForPost } from "@/lib/related";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublishedSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const meta = pageMetadata({
    title: `${post.title} | ${SITE_NAME}`,
    description: post.description,
    path: `/blog/${slug}`,
  });
  // Keep unreviewed drafts out of search indexes until published.
  if (post.draft) meta.robots = { index: false, follow: true };
  return meta;
}

function formatDate(date: string) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  // Defense in depth: block draft posts in production even if generated.
  if (post.draft && !showDrafts) notFound();

  const relatedServices = getRelatedServicesForPost(slug);

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Resources", path: "/blog" },
    { name: post.title, path: `/blog/${slug}` },
  ];

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Organization", name: post.author ?? clinic.name },
    publisher: { "@type": "Organization", name: clinic.name },
    mainEntityOfPage: `${SITE_URL}/blog/${slug}`,
  };

  return (
    <>
      <JsonLd data={[articleSchema, breadcrumbSchema(crumbs)]} />

      <section className="relative overflow-hidden bg-warm-white pt-28 pb-10 sm:pt-32 md:pt-36">
        <KineticMotionLine className="absolute inset-x-0 bottom-0 h-20 opacity-40" />
        <Container className="relative max-w-3xl">
          <Breadcrumbs items={crumbs} />
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-charcoal/50">
            <span>{formatDate(post.date)}</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {post.readingTime} min read
            </span>
            {post.draft && (
              <span className="rounded-pill bg-cta-orange/90 px-2.5 py-0.5 text-xs font-semibold text-charcoal">
                Draft — pending review
              </span>
            )}
          </div>
          <h1 className="mt-4 text-page-h1 font-extrabold text-charcoal">{post.title}</h1>
          <p className="mt-4 text-lg leading-relaxed text-charcoal/70">{post.description}</p>
        </Container>
      </section>

      <Section tone="white" className="pt-0 md:pt-0">
        <Container className="max-w-3xl">
          <article className="prose-kt">
            <MDXRemote source={post.content} components={mdxComponents} />
          </article>

          <div className="mt-12 border-t border-silver/60 pt-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-deep-teal hover:text-charcoal"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to all resources
            </Link>
          </div>
        </Container>
      </Section>

      {relatedServices.length > 0 && (
        <Section tone="sage">
          <Container>
            <SectionHeading eyebrow="Related services" title="Care that pairs with this article." />
            <StaggeredGrid className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relatedServices.map((service) => (
                <ScrollItem key={service.slug} as="article" className="h-full">
                  <ServiceCard service={service} />
                </ScrollItem>
              ))}
            </StaggeredGrid>
          </Container>
        </Section>
      )}

      <FinalCTA source={`blog_post:${slug}`} />
    </>
  );
}
