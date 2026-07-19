"use client";

import { useEffect } from "react";
import { Container } from "@/components/layout/Section";
import { LinkButton } from "@/components/ui/Button";
import { BookButton } from "@/components/ui/BookButton";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="flex min-h-[70vh] items-center bg-warm-white pt-28">
      <Container className="text-center">
        <p className="font-heading text-6xl font-extrabold text-mint">Oops</p>
        <h1 className="mt-4 text-section-h2 font-bold text-charcoal">
          Something went wrong.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-charcoal/70">
          We hit an unexpected error loading this page. You can try again, or head back
          home — if it keeps happening, give us a call and we&apos;ll help directly.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="group inline-flex items-center justify-center gap-2 rounded-pill bg-mint px-7 py-4 text-[17px] font-semibold text-charcoal transition-all duration-200 ease-premium hover:shadow-button-hover hover:-translate-y-0.5 focus-visible:outline-none"
          >
            Try again
          </button>
          <BookButton label="Book Now" size="lg" withIcon source="error_page" />
          <LinkButton href="/" variant="secondary" size="lg" withArrow={false}>
            Back to Home
          </LinkButton>
        </div>
      </Container>
    </section>
  );
}
