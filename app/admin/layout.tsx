import type { Metadata } from "next";

import { SITE_NAME } from "@/lib/seo";
import { getClinic } from "@/lib/content/store";

/**
 * Shell for the staff portal.
 *
 * Deliberately thin: it sets the page chrome-free background and the noindex
 * rules, and nothing else. The signed-in furniture (the top bar, the sign-out
 * button) belongs to `(portal)/layout.tsx`, which sits below this one and can
 * assume a session — this layout also wraps the login screen, so anything it
 * renders has to make sense to someone who hasn't signed in yet.
 */

export async function generateMetadata(): Promise<Metadata> {
  const { name } = await getClinic();
  const siteName = name || SITE_NAME;
  return {
    title: {
      default: `Staff portal | ${siteName}`,
      template: `%s | ${siteName} staff portal`,
    },
    // Belt and braces with the Disallow in robots.ts: that file asks crawlers
    // not to fetch these URLs, this tells any that do anyway not to index them.
    robots: { index: false, follow: false, nocache: true },
  };
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-warm-white text-charcoal">{children}</div>;
}
