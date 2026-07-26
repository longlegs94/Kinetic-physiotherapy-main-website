import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import type { PostMeta } from "@/lib/blog";

function formatDate(date: string) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function BlogCard({ post }: { post: PostMeta }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-card border border-silver/60 bg-white shadow-card transition-all duration-200 ease-premium hover:-translate-y-1 hover:border-mint">
      <div className="relative flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-sage to-mint/30">
        {/* TODO(assets): optional featured image per post. */}
        <span className="font-heading text-xs font-semibold uppercase tracking-[0.16em] text-charcoal/60">
          {post.tags[0] ?? "Article"}
        </span>
        {post.draft && (
          <span className="absolute right-3 top-3 rounded-pill bg-cta-orange/90 px-2.5 py-1 text-xs font-semibold text-charcoal">
            Draft
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-3 text-xs text-charcoal/50">
          <span>{formatDate(post.date)}</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {post.readingTime} min read
          </span>
        </div>
        <h2 className="mt-3 text-card-title font-bold text-charcoal">
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </h2>
        <p className="mt-2 flex-1 text-[15px] leading-relaxed text-charcoal/70">
          {post.excerpt}
        </p>
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-deep-teal">
          Read article
          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-1"
            aria-hidden="true"
          />
        </span>
      </div>
    </article>
  );
}
