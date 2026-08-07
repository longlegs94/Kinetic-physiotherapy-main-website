"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, Phone, RotateCw } from "lucide-react";

import { clinic, phoneHref } from "@/lib/site-data";

/**
 * Route-level error boundary. Without one, an exception during render shows
 * Next's default error screen — a blank page in production — which for a
 * clinic site means a visitor mid-booking simply loses the thread with no way
 * to reach anyone.
 *
 * The clinic's phone number is the important element here: whatever broke, a
 * person trying to book can still get through. `reset()` re-renders the
 * segment, which recovers from transient failures without a full reload.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Only the digest — the stable hash Next assigns so this render can be
    // matched to a server log. The message and stack can carry whatever was
    // being rendered, which on this site includes intake and contact input.
    console.error("Route error boundary caught an error, digest:", error.digest ?? "none");
  }, [error.digest]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-5 px-6 py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-mint/30 text-deep-teal">
        <AlertCircle className="h-7 w-7" aria-hidden="true" />
      </span>

      <h1 className="font-heading text-3xl font-bold text-charcoal">Something went wrong</h1>

      <p className="text-[17px] leading-relaxed text-charcoal/70">
        Sorry — this page didn&apos;t load properly. It&apos;s on our side, not yours. You can
        try again, or call the clinic and we&apos;ll sort it out with you directly.
      </p>

      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="group inline-flex items-center justify-center gap-2 rounded-pill bg-mint px-6 py-3.5 text-[15px] font-semibold text-charcoal transition-all duration-200 hover:-translate-y-0.5 hover:shadow-button-hover"
        >
          <RotateCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>

        <a
          href={phoneHref}
          className="inline-flex items-center justify-center gap-2 rounded-pill border-2 border-deep-teal px-6 py-3.5 text-[15px] font-semibold text-deep-teal transition-all duration-200 hover:-translate-y-0.5 hover:bg-deep-teal hover:text-warm-white"
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          Call {clinic.phone}
        </a>
      </div>

      <Link
        href="/"
        className="mt-2 text-sm font-semibold text-deep-teal underline underline-offset-4"
      >
        Back to the homepage
      </Link>

      {error.digest && (
        <p className="mt-4 text-xs text-charcoal/45">
          Reference: <code>{error.digest}</code>
        </p>
      )}
    </main>
  );
}
