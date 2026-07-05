import Link from "next/link";
import { HelpCircle, ArrowRight } from "lucide-react";

/**
 * "Not sure what to book?" prompt. Routes to contact so the team can guide
 * visitors who can't self-select a service.
 */
export function NotSureCTA({ className }: { className?: string }) {
  return (
    <Link
      href="/contact"
      className={`group inline-flex items-center gap-3 rounded-pill border border-deep-teal/30 bg-sage/40 px-6 py-4 text-left transition-colors hover:border-deep-teal hover:bg-sage/70 ${className ?? ""}`}
    >
      <HelpCircle className="h-6 w-6 shrink-0 text-deep-teal" aria-hidden="true" />
      <span>
        <span className="block text-[15px] font-semibold text-charcoal">
          Not sure what to book?
        </span>
        <span className="block text-sm text-charcoal/60">
          Tell us what&apos;s going on and we&apos;ll guide you.
        </span>
      </span>
      <ArrowRight
        className="ml-1 h-5 w-5 shrink-0 text-deep-teal transition-transform duration-200 ease-premium group-hover:translate-x-1"
        aria-hidden="true"
      />
    </Link>
  );
}
