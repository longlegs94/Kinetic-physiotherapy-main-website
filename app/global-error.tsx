"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary for errors thrown in the root layout itself, where
 * app/error.tsx cannot help because the layout that would wrap it is the thing
 * that failed. It therefore has to render its own <html> and <body>.
 *
 * Deliberately dependency-free: no fonts, no design tokens, no imports from
 * lib/. Anything imported here is another thing that can fail in the exact
 * situation this component exists to survive, so the styles are inline and the
 * phone number is literal.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary caught an error, digest:", error.digest ?? "none");
  }, [error.digest]);

  return (
    <html lang="en-CA">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          backgroundColor: "#FAF9F7",
          color: "#2B2B2B",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          textAlign: "center",
        }}
      >
        <main style={{ maxWidth: "34rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0 0 0.75rem" }}>
            Kinetic Therapy Clinic
          </h1>
          <p style={{ fontSize: "1.05rem", lineHeight: 1.6, margin: "0 0 1.5rem", opacity: 0.75 }}>
            Our website is having trouble right now. The clinic is still here — please call us
            and we&apos;ll help you directly.
          </p>

          <a
            // Literal rather than imported from lib/site-data: this boundary
            // must not depend on a module that could itself be the failure.
            // Keep in sync with clinic.phone in content/site-content.json.
            href="tel:6044672113"
            style={{
              display: "inline-block",
              padding: "0.9rem 1.6rem",
              borderRadius: "999px",
              backgroundColor: "#A8E6CF",
              color: "#2B2B2B",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Call (604) 467-2113
          </a>

          <p style={{ marginTop: "1.5rem" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "#00695C",
                fontSize: "0.95rem",
                fontWeight: 600,
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              Try loading the page again
            </button>
          </p>

          {error.digest && (
            <p style={{ marginTop: "1.5rem", fontSize: "0.75rem", opacity: 0.45 }}>
              Reference: <code>{error.digest}</code>
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
