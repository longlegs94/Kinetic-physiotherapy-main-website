import Link from "next/link";
import { Building2, ExternalLink, Users } from "lucide-react";

import { getAdminSession } from "@/lib/admin/auth";
import { SESSION_TTL_SECONDS } from "@/lib/admin/session";
import { readContent, contentOf } from "@/lib/admin/content-source";
import { listPractitioners } from "@/lib/admin/content-schema";
import { LoadErrorNotice, ReadOnlyNotice } from "@/components/admin/StatusBanners";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await getAdminSession();
  const source = await readContent();
  const practitioners = listPractitioners(contentOf(source));
  const hours = Math.round(SESSION_TTL_SECONDS / 3600);

  const sections = [
    {
      href: "/admin/team",
      icon: Users,
      title: "Therapists",
      description: `${practitioners.length} on the public team page. Add someone new, update a bio, or remove a leaver.`,
    },
    {
      href: "/admin/clinic",
      icon: Building2,
      title: "Clinic information",
      description:
        "Phone, email, address, opening hours, booking link and social profiles — everything the site and Google show.",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-charcoal">
          What would you like to update?
        </h1>
        <p className="mt-2 text-[15px] text-charcoal/60">
          Signed in as {session?.email}. Sessions last {hours} hours.
        </p>
      </div>

      {source.mode === "bundled" && <ReadOnlyNotice />}
      {source.mode === "error" && <LoadErrorNotice message={source.message} />}

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-card border border-silver/70 bg-white p-6 transition-colors hover:border-deep-teal"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sage text-deep-teal">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-heading text-lg font-bold text-charcoal">{title}</h2>
            <p className="mt-1.5 text-[15px] leading-relaxed text-charcoal/60">{description}</p>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-charcoal/50">
          Not in the portal yet
        </h2>
        <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-charcoal/65">
          Services, blog posts, testimonials and page copy are still edited in the repository —
          services in{" "}
          <code className="rounded bg-sage/60 px-1.5 py-0.5 text-[13px]">
            content/site-content.json
          </code>
          , posts in <code className="rounded bg-sage/60 px-1.5 py-0.5 text-[13px]">content/blog</code>.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-deep-teal underline-offset-4 hover:underline"
        >
          View the live site
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
