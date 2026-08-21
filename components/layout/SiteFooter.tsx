"use client";

import Link from "next/link";
import { MapPin, Phone, Mail, Clock, Facebook, Instagram } from "lucide-react";
import { services } from "@/lib/site-data";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { Logo } from "./Logo";
import { BookButton } from "@/components/ui/BookButton";
import { KineticMotionLine } from "@/components/motion/KineticMotionLine";
import { trackEvent } from "@/lib/analytics";

const clinicLinks = [
  { label: "Services", href: "/services" },
  { label: "Our Team", href: "/team" },
  { label: "About", href: "/about" },
  { label: "Testimonials", href: "/testimonials" },
  { label: "Resources", href: "/blog" },
  { label: "Contact", href: "/contact" },
  { label: "Leave a Review", href: "/review" },
];

/** Dark charcoal footer with mint accent line and four columns. */
export function SiteFooter() {
  const { clinic, phoneHref, emailHref } = useSiteData();
  const featuredServices = services.slice(0, 6);

  return (
    <footer className="relative overflow-hidden bg-charcoal text-warm-white">
      <KineticMotionLine className="absolute inset-x-0 top-0 h-16 opacity-40" />

      <div className="container-kt relative py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Logo tone="light" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-warm-white/70">
              {clinic.positioning}
            </p>
            <BookButton
              label="Book on Jane"
              variant="primary"
              className="mt-6"
              withIcon
              source="footer"
            />
            {(clinic.socials?.facebook || clinic.socials?.instagram) && (
              <div className="mt-6 flex gap-3">
                {clinic.socials?.facebook && (
                  <a
                    href={clinic.socials.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${clinic.name} on Facebook`}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-warm-white/70 transition-colors hover:border-mint hover:text-mint"
                  >
                    <Facebook className="h-4 w-4" aria-hidden="true" />
                  </a>
                )}
                {clinic.socials?.instagram && (
                  <a
                    href={clinic.socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${clinic.name} on Instagram`}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-warm-white/70 transition-colors hover:border-mint hover:text-mint"
                  >
                    <Instagram className="h-4 w-4" aria-hidden="true" />
                  </a>
                )}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-mint">
              Services
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm text-warm-white/75">
              {featuredServices.map((s) => (
                <li key={s.slug}>
                  <Link href={`/${s.slug}`} className="hover:text-mint">
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-mint">
              Clinic
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm text-warm-white/75">
              {clinicLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={
                      l.href === "/review"
                        ? () => trackEvent("review_cta_click", { source: "footer" })
                        : undefined
                    }
                    className="hover:text-mint"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-mint">
              Visit Us
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-warm-white/75">
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-mint" aria-hidden="true" />
                <span>{clinic.address}</span>
              </li>
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-mint" aria-hidden="true" />
                <a href={phoneHref} className="hover:text-mint">
                  {clinic.phone}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-mint" aria-hidden="true" />
                <a href={emailHref} className="break-all hover:text-mint">
                  {clinic.email}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-mint" aria-hidden="true" />
                <div>
                  {clinic.hours.map((h) => (
                    <div key={h.days}>
                      <span className="text-warm-white">{h.days}:</span> {h.hours}
                    </div>
                  ))}
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-sm text-warm-white/55 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} {clinic.name}. All rights reserved.
          </p>
          <div className="flex gap-5">
            <Link href="/privacy-policy" className="hover:text-mint">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-mint">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
