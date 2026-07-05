import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/**
 * Filesystem-backed blog. Posts live in content/blog/*.mdx with frontmatter.
 * Read at build time (server only). To publish, set `draft: false`.
 */

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export type PostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  excerpt: string;
  tags: string[];
  author?: string;
  draft: boolean;
  readingTime: number;
};

export type Post = PostMeta & { content: string };

function readFileSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export function getPost(slug: string): Post | undefined {
  const file = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(file)) return undefined;
  const raw = fs.readFileSync(file, "utf8");
  const { data, content } = matter(raw);
  return {
    slug,
    title: data.title ?? slug,
    description: data.description ?? "",
    date: data.date ?? "",
    excerpt: data.excerpt ?? data.description ?? "",
    tags: data.tags ?? [],
    author: data.author,
    draft: data.draft ?? false,
    readingTime: estimateReadingTime(content),
    content,
  };
}

/**
 * All posts, newest first. Drafts are included by default so the owner can
 * review them on the deployed site (they render with a "Draft" badge and are
 * marked noindex + excluded from the sitemap until `draft: false`).
 */
export function getAllPosts(includeDrafts = true): PostMeta[] {
  return readFileSlugs()
    .map((slug) => getPost(slug))
    .filter((p): p is Post => Boolean(p))
    .filter((p) => includeDrafts || !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map(({ content: _content, ...meta }) => meta);
}

/** All slugs (including drafts) — used to statically generate post pages. */
export function getPublishedSlugs(): string[] {
  return getAllPosts(true).map((p) => p.slug);
}

/** Only published (non-draft) posts — used for the sitemap. */
export function getIndexablePosts(): PostMeta[] {
  return getAllPosts(false);
}
