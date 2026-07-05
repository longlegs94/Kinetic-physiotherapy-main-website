"use client";

import { Calendar } from "lucide-react";
import { LinkButton } from "./Button";
import { janeBookingUrl } from "@/lib/site-data";
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
  href = janeBookingUrl,
  variant = "primary",
  size = "md",
  className,
  withIcon = false,
  source = "generic",
}: BookButtonProps) {
  const isJane = href === janeBookingUrl;
  return (
    <LinkButton
      href={href}
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
