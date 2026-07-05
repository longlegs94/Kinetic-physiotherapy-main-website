import type { ReactNode } from "react";
import { Container } from "./Section";
import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";
import { KineticMotionLine } from "@/components/motion/KineticMotionLine";

/** Inner-page hero with breadcrumb, title, subtitle, and optional actions. */
export function PageHero({
  title,
  subtitle,
  crumbs,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  crumbs?: Crumb[];
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-warm-white pt-28 pb-14 sm:pt-32 md:pt-36 md:pb-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-16 h-96 w-96 rounded-full bg-mint/15 blur-3xl"
      />
      <KineticMotionLine className="absolute inset-x-0 bottom-0 h-24 opacity-40" />
      <Container className="relative">
        {crumbs && <Breadcrumbs items={crumbs} />}
        <h1 className="mt-4 max-w-3xl text-page-h1 font-extrabold text-charcoal">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-charcoal/70">
            {subtitle}
          </p>
        )}
        {actions && <div className="mt-8 flex flex-col gap-3 sm:flex-row">{actions}</div>}
        {children}
      </Container>
    </section>
  );
}
