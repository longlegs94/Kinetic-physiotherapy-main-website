import Link from "next/link";
import { Building2, ExternalLink, History, Users } from "lucide-react";

import { getAdminSession } from "@/lib/admin/auth";
import { SESSION_TTL_SECONDS } from "@/lib/admin/session";
import { listPractitioners, recentChanges } from "@/lib/content/admin-store";
import { readConfigured, writeConfigured } from "@/lib/content/supabase";
import { LoadErrorNotice, ReadOnlyNotice } from "@/components/admin/StatusBanners";

export const metadata = { title: "Dashboard" };

/** Relative time, so "3 hours ago" reads faster than a timestamp for the
 *  question this list answers: has anything changed recently? */
function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  const units: [number, string][] = [
    [60, "just now"],
    [3600, "minute"],
    [86400, "hour"],
    [2592000, "day"],
  ];
  if (seconds < 60) return "just now";
  for (let i = 1; i < units.length; i += 1) {
    if (seconds < units[i][0]) {
      const n = Math.floor(seconds / units[i - 1][0]);
      return `${n} ${units[i][1]}${n === 1 ? "" : "s"} ago`;
    }
  }
  return new Date(iso).toLocaleDateString("en-CA");
}

export default async function DashboardPage() {
  const session = await getAdminSession();
  const hours = Math.round(SESSION_TTL_SECONDS / 3600);

  let count = 0;
  let loadError: string | null = null;
  try {
    count = readConfigured() ? (await listPractitioners()).length : 0;
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Couldn't reach the database.";
  }
  const changes = await recentChanges(8);

  const sections = [
    {
      href: "/admin/team",
      icon: Users,
      title: "Therapists",
      description: `${count} on the public team page. Add someone new, update a bio, or remove a leaver.`,
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

      {loadError && <LoadErrorNotice message={loadError} />}
      {!writeConfigured() && !loadError && <ReadOnlyNotice />}

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

      {changes.length > 0 && (
        <div>
          <h2 className="flex items-center gap-2 font-heading text-sm font-bold uppercase tracking-wide text-charcoal/50">
            <History className="h-4 w-4" aria-hidden="true" />
            Recent changes
          </h2>
          <ul className="mt-3 divide-y divide-silver/60 rounded-card border border-silver/70 bg-white">
            {changes.map((change) => (
              <li key={change.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-3">
                <span className="text-[15px] text-charcoal">{change.summary}</span>
                <span className="text-sm text-charcoal/50">
                  {change.actorEmail} · {timeAgo(change.changedAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

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
