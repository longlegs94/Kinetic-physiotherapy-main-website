"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { X } from "lucide-react";
import { navigation, clinic } from "@/lib/site-data";
import { Logo } from "./Logo";
import { BookButton } from "@/components/ui/BookButton";
import { CallButton } from "@/components/ui/CallButton";
import { useFocusTrap } from "@/components/hooks/useFocusTrap";
import { easePremium } from "@/lib/motion";

/** Full-height mobile navigation sheet with Book / Call at the top. */
export function MobileNavSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Runs before the close-button-focus effect below so it captures the
  // hamburger button (not the close button) as the element to restore
  // focus to when the sheet closes.
  useFocusTrap(open, panelRef);

  // Lock body scroll while open, close on Escape, and move focus into the
  // sheet so keyboard users land inside it rather than on the page behind.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          className="fixed inset-0 z-[70] md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
        >
          <div className="absolute inset-0 bg-charcoal/40" onClick={onClose} />
          <motion.div
            className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-warm-white shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: easePremium }}
          >
            <div className="flex items-center justify-between border-b border-silver/60 px-5 py-4">
              <Logo />
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="rounded-pill p-2 text-charcoal hover:bg-sage/60"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex flex-col gap-3 px-5 py-5">
              <BookButton label="Book Now" size="lg" className="w-full" withIcon source="mobile_nav" />
              <CallButton variant="secondary" size="lg" className="w-full" />
            </div>

            <nav className="flex flex-col px-2 py-2" aria-label="Primary">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="rounded-2xl px-4 py-3.5 text-lg font-semibold text-charcoal transition-colors hover:bg-sage/60"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto border-t border-silver/60 px-5 py-5 text-sm text-charcoal/70">
              <p className="font-semibold text-charcoal">{clinic.name}</p>
              <p className="mt-1">{clinic.address}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
