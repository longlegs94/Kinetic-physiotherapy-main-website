"use client";

import { useEffect } from "react";

import { Container } from "@/components/layout/Section";
import { LinkButton } from "@/components/ui/Button";
import { clinic } from "@/lib/site-data";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled page error:", error);
  }, [error]);

  return (
    <section className="flex min-h-[70vh] items-center bg-warm-white pt-28">
      <Container className="text-center">
        <p className="font-heading text-6xl font-extrabold text-mint">Oops</p>
        <h1 className="mt-4 text-section-h2 font-bold text-charcoal">
          Something went wrong.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-charcoal/70">
          We hit an unexpected error loading this page. You can try again, or call the clinic
          directly at {clinic.phone} and we&apos;ll help you right away.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-pill bg-deep-teal px-6 py-3 text-base font-semibold text-white transition hover:bg-deep-teal/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal focus-visible:ring-offset-2"
          >
            Try again
          </button>
          <LinkButton href="/" variant="secondary" size="lg" withArrow={false}>
            Back to Home
          </LinkButton>
        </div>
      </Container>
    </section>
  );
}
