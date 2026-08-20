"use client";

import { Calendar } from "lucide-react";
import { LinkButton } from "./Button";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type BookButtonProps = {
  label?: string;
  href?: string;
  variant?: "primary" | "secondary" | "secondary-dark";
  size?: "md" | "lg";
  className?: string;
  withIcon?: boolean;
  source?: string;
};

/** Primary conversion button. Opens Jane booking and fires an analytics event. */
export function BookButton({
  label = "Book Now",
  href,
  variant = "primary",
  size = "md",
  className,
  withIcon = false,
  source = "generic",
}: BookButtonProps) {
  const { janeBookingUrl } = useSiteData();
  // Defaulted here rather than in the parameter list: the booking URL is now
  // read from the database through a hook, which cannot run in a default.
  const target = href ?? janeBookingUrl;
  const isJane = target === janeBookingUrl;
  return (
    <LinkButton
      href={target}
      external
      variant={variant}
      size={size}
      className={cn(className)}
      aria-label={label}
      onClick={() =>
        trackEvent(isJane ? "jane_outbound_click" : "book_now_click", { source })
      }
    >
      {withIcon && <Calendar className="h-[18px] w-[18px]" aria-hidden="true" />}
      {label}
    </LinkButton>
  );
}
