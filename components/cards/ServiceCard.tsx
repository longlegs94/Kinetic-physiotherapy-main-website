"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Service } from "@/lib/site-data";
import { ServiceIcon } from "@/components/ui/ServiceIcon";
import { BookButton } from "@/components/ui/BookButton";
import { trackEvent } from "@/lib/analytics";

/** Service card used in overview grids. Title and "Learn more" link to the service page. */
export function ServiceCard({ service }: { service: Service }) {
  return (
    <div className="group flex h-full flex-col rounded-card glass p-6 transition-all duration-200 ease-premium hover:-translate-y-1 hover:border-mint">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sage/70 text-deep-teal transition-colors group-hover:bg-mint group-hover:text-charcoal">
        <ServiceIcon name={service.shortName} className="h-6 w-6" />
      </span>

      <h3 className="mt-5 text-card-title font-bold text-charcoal">
        <Link
          href={`/${service.slug}`}
          onClick={() => trackEvent("service_card_click", { service: service.slug })}
          className="transition-colors hover:text-deep-teal"
        >
          {service.name}
        </Link>
      </h3>

      <p className="mt-2 flex-1 text-[15px] leading-relaxed text-charcoal/70">
        {service.description}
      </p>

      {service.conditions.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {service.conditions.slice(0, 3).map((condition) => (
            <li
              key={condition}
              className="rounded-pill bg-sage/70 px-2.5 py-1 text-xs font-medium text-charcoal/70"
            >
              {condition}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <Link
          href={`/${service.slug}`}
          onClick={() => trackEvent("service_card_click", { service: service.slug })}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-deep-teal"
        >
          Learn more
          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
        <BookButton
          label="Book"
          variant="secondary"
          size="md"
          source={`service_card:${service.slug}`}
        />
      </div>
    </div>
  );
}
