import { Container } from "@/components/layout/Section";
import { LinkButton } from "@/components/ui/Button";
import { BookButton } from "@/components/ui/BookButton";

export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] items-center bg-warm-white pt-28">
      <Container className="text-center">
        <p className="font-heading text-6xl font-extrabold text-deep-teal">404</p>
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
  );
}
