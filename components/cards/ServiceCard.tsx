"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Service } from "@/lib/site-data";
import { ServiceIcon } from "@/components/ui/ServiceIcon";
import { trackEvent } from "@/lib/analytics";

/** Service card used in overview grids. Whole card links to the service page. */
export function ServiceCard({ service }: { service: Service }) {
  return (
    <Link
      href={`/${service.slug}`}
      onClick={() => trackEvent("service_card_click", { service: service.slug })}
      className="group flex h-full flex-col rounded-card border border-silver/60 bg-white p-6 shadow-card transition-all duration-200 ease-premium hover:-translate-y-1 hover:border-mint hover:bg-sage/30"
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sage/70 text-deep-teal transition-colors group-hover:bg-mint group-hover:text-charcoal">
        <ServiceIcon name={service.shortName} className="h-6 w-6" />
      </span>
      <h3 className="mt-5 text-card-title font-bold text-charcoal">{service.name}</h3>
      <p className="mt-2 flex-1 text-[15px] leading-relaxed text-charcoal/70">
        {service.description}
      </p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-deep-teal">
        Learn more
        <ArrowRight
          className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-1"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}
