import { Container } from "@/components/layout/Section";
import { LinkButton } from "@/components/ui/Button";
import { BookButton } from "@/components/ui/BookButton";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

/**
 * Global 404. This sits above the `(site)` route group so it can also catch
 * URLs that match no segment at all (`/one/two/three`), which means it renders
 * inside the bare root layout and has to bring the site chrome itself.
 */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="flex min-h-[70vh] items-center bg-warm-white pt-28">
          <Container className="text-center">
            <p className="font-heading text-6xl font-extrabold text-mint">404</p>
            <h1 className="mt-4 text-section-h2 font-bold text-charcoal">
              We couldn&apos;t find that page.
            </h1>
            <p className="mx-auto mt-4 max-w-md text-lg text-charcoal/70">
              The page may have moved. Let&apos;s get you back on track — explore our services or
              book an appointment.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <BookButton label="Book Now" size="lg" withIcon source="404" />
              <LinkButton href="/" variant="secondary" size="lg" withArrow={false}>
                Back to Home
              </LinkButton>
            </div>
          </Container>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
