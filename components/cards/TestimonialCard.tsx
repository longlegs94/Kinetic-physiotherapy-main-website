import { Star, Quote } from "lucide-react";
import type { Testimonial } from "@/lib/site-data";
import { cn } from "@/lib/utils";

/** Single testimonial with animated-in star rating (CSS) and quote. */
export function TestimonialCard({
  testimonial,
  tone = "light",
}: {
  testimonial: Testimonial;
  tone?: "light" | "dark";
}) {
  const t = testimonial;
  return (
    <figure
      className={cn(
        "flex h-full flex-col rounded-card p-7 shadow-card",
        tone === "dark"
          ? "bg-soft-black text-warm-white"
          : "border border-silver/60 bg-white text-charcoal"
      )}
    >
      <Quote
        className={cn("h-8 w-8", tone === "dark" ? "text-mint" : "text-mint")}
        aria-hidden="true"
      />
      <div className="mt-3 flex gap-0.5" aria-label={`${t.rating} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-4 w-4",
              i < t.rating ? "fill-cta-orange text-cta-orange" : "text-silver"
            )}
            aria-hidden="true"
          />
        ))}
      </div>
      <blockquote
        className={cn(
          "mt-4 flex-1 text-lg leading-relaxed",
          tone === "dark" ? "text-warm-white/90" : "text-charcoal/85"
        )}
      >
        “{t.quote}”
      </blockquote>
      <figcaption
        className={cn(
          "mt-5 text-sm font-semibold",
          tone === "dark" ? "text-mint" : "text-deep-teal"
        )}
      >
        — {t.name}
      </figcaption>
    </figure>
  );
}
