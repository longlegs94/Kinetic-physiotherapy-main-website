import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * Styled element map for MDX blog content (no typography plugin needed).
 * Keeps article prose consistent with the design system.
 */
export const mdxComponents = {
  h2: (props: ComponentProps<"h2">) => (
    <h2 className="mt-10 text-2xl font-bold text-charcoal sm:text-3xl" {...props} />
  ),
  h3: (props: ComponentProps<"h3">) => (
    <h3 className="mt-8 text-xl font-bold text-charcoal" {...props} />
  ),
  p: (props: ComponentProps<"p">) => (
    <p className="mt-4 text-[17px] leading-relaxed text-charcoal/80" {...props} />
  ),
  ul: (props: ComponentProps<"ul">) => (
    <ul className="mt-4 list-disc space-y-2 pl-6 text-[17px] leading-relaxed text-charcoal/80" {...props} />
  ),
  ol: (props: ComponentProps<"ol">) => (
    <ol className="mt-4 list-decimal space-y-2 pl-6 text-[17px] leading-relaxed text-charcoal/80" {...props} />
  ),
  li: (props: ComponentProps<"li">) => <li className="pl-1" {...props} />,
  strong: (props: ComponentProps<"strong">) => (
    <strong className="font-semibold text-charcoal" {...props} />
  ),
  a: ({ href = "#", ...props }: ComponentProps<"a">) => {
    const isInternal = href.startsWith("/");
    if (isInternal) {
      return (
        <Link href={href} className="font-medium text-deep-teal underline underline-offset-2 hover:text-charcoal" {...props} />
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-deep-teal underline underline-offset-2 hover:text-charcoal"
        {...props}
      />
    );
  },
  blockquote: (props: ComponentProps<"blockquote">) => (
    <blockquote className="mt-6 border-l-4 border-mint bg-sage/40 px-5 py-3 text-lg italic text-charcoal/80" {...props} />
  ),
  hr: () => <hr className="my-10 border-silver/60" />,
  h1: (props: ComponentProps<"h1">) => (
    // Post title is rendered by the page; downgrade any in-body h1 to h2 styling.
    <h2 className="mt-10 text-2xl font-bold text-charcoal sm:text-3xl" {...props} />
  ),
};
