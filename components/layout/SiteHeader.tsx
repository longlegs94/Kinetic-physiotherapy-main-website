"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { navigation } from "@/lib/site-data";
import { Logo } from "./Logo";
import { BookButton } from "@/components/ui/BookButton";
import { MobileNavSheet } from "./MobileNavSheet";
import { cn } from "@/lib/utils";

/**
 * Sticky header. Transparent-clean at the top, becomes a blurred glass bar
 * on scroll. Active nav item gets a mint underline.
 */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[60] transition-all duration-300 ease-premium",
        scrolled
          ? "border-b border-silver/50 bg-warm-white/80 backdrop-blur-lg"
          : "bg-transparent"
      )}
    >
      <div className="container-kt flex items-center justify-between gap-4 py-3.5">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {navigation.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative rounded-pill px-4 py-2 text-[15px] font-medium text-charcoal/80 transition-colors hover:text-charcoal",
                  active && "text-charcoal"
                )}
              >
                {item.label}
                <span
                  className={cn(
                    "absolute inset-x-4 -bottom-0.5 h-0.5 origin-left rounded-full bg-deep-teal transition-transform duration-200 ease-premium",
                    active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <BookButton label="Book Now" className="hidden sm:inline-flex" source="header" />
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className="rounded-pill p-2.5 text-charcoal hover:bg-sage/60 md:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      <MobileNavSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
