import Link from "next/link";
import { Pencil, Plus, UserRound } from "lucide-react";

import { readContent, contentOf } from "@/lib/admin/content-source";
import { listPractitioners } from "@/lib/admin/content-schema";
import {
  DeployPendingNotice,
  LoadErrorNotice,
  ReadOnlyNotice,
} from "@/components/admin/StatusBanners";
import { SuccessMessage } from "@/components/admin/FormFields";

export const metadata = { title: "Therapists" };

const SAVED_MESSAGES: Record<string, string> = {
  added: "Therapist added.",
  updated: "Changes saved.",
  removed: "Therapist removed.",
};

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  const source = await readContent();
  const practitioners = listPractitioners(contentOf(source));
  const canEdit = source.mode === "live";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-charcoal">Therapists</h1>
          <p className="mt-2 text-[15px] text-charcoal/60">
            {practitioners.length} {practitioners.length === 1 ? "person" : "people"} on the public
            team page.
          </p>
        </div>
        {canEdit && (
          <Link
            href="/admin/team/new"
            className="inline-flex items-center gap-2 rounded-pill bg-mint px-6 py-3 text-[15px] font-semibold text-charcoal transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:shadow-button-hover"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add therapist
          </Link>
        )}
      </div>

      {source.mode === "bundled" && <ReadOnlyNotice />}
      {source.mode === "error" && <LoadErrorNotice message={source.message} />}
      {saved && SAVED_MESSAGES[saved] && (
        <SuccessMessage>
          {SAVED_MESSAGES[saved]} It will appear on the website within about a minute.
        </SuccessMessage>
      )}
      {error && (
        <p
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error === "unknown" ? "That therapist couldn't be found." : error}
        </p>
      )}

      <ul className="space-y-3">
        {practitioners.map((person, index) => {
          const name = String(person.name ?? "Unnamed");
          const title = String(person.title ?? "");
          const category = String(person.category ?? "");
          const unverified = person.needsVerification === true;

          return (
            <li
              key={`${name}-${index}`}
              className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-silver/70 bg-white px-5 py-4"
            >
              <div className="flex min-w-0 items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sage text-deep-teal">
                  <UserRound className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-charcoal">
                    {name}
                    {unverified && (
                      <span className="ml-2 rounded-pill bg-cta-orange/15 px-2 py-0.5 text-xs font-semibold text-cta-orange">
                        Hidden until verified
                      </span>
                    )}
                  </p>
                  <p className="truncate text-sm text-charcoal/60">
                    {title}
                    {category && ` · ${category}`}
                  </p>
                </div>
              </div>

              {canEdit && (
                <Link
                  href={`/admin/team/${index}`}
                  className="inline-flex shrink-0 items-center gap-2 rounded-pill border border-charcoal/20 px-4 py-2 text-sm font-semibold text-charcoal transition-colors hover:border-deep-teal hover:bg-sage/50"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Edit
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      {practitioners.length === 0 && (
        <p className="rounded-card border border-dashed border-silver bg-white/60 px-5 py-8 text-center text-[15px] text-charcoal/60">
          No therapists listed yet.
        </p>
      )}

      {canEdit && <DeployPendingNotice />}
    </div>
  );
}
