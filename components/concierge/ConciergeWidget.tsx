"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, X, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { janeBookingUrl, clinic, phoneHref } from "@/lib/site-data";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { easePremium } from "@/lib/motion";

type ServiceLink = { name: string; slug: string };

type Message = {
  role: "user" | "assistant";
  content: string;
  services?: ServiceLink[];
  showBooking?: boolean;
  showContact?: boolean;
  /**
   * Server-issued HMAC proving this assistant turn came from us. Replayed on
   * the next request so the server can tell its own prior output apart from
   * text the browser made up — see lib/message-auth.ts. Locally generated
   * messages (the greeting, offline notices) have none and are dropped from
   * the model's view server-side, which costs context but never trust.
   */
  signature?: string;
};

const GREETING: Message = {
  role: "assistant",
  content:
    "Hi! Tell me what's going on — an injury, pain, ICBC claim, or anything else — and I'll point you to the right care.",
};

const OFFLINE_MESSAGE: Message = {
  role: "assistant",
  content: `I'm offline right now — but our team isn't! Call ${clinic.phone} or use the contact page and we'll guide you.`,
  showContact: true,
};

const QUICK_REPLIES = [
  "I was in a car accident",
  "I have back pain",
  "I want a massage",
  "Help me choose",
];

const MAX_INPUT_LENGTH = 500;

/**
 * Floating AI booking concierge. Launcher pill + glass chat panel.
 * Lazily checks /api/concierge on first open; falls back to a graceful
 * offline message (with phone + contact links) if unconfigured or erroring.
 */
export function ConciergeWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [checkedAvailability, setCheckedAvailability] = useState(false);
  const [offline, setOffline] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const reducedMotion = useReducedMotionSafe();

  // The element focus came from, so closing the panel returns focus there
  // instead of dropping it to <body> — which would send a keyboard or screen
  // reader user back to the top of the page.
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      inputRef.current?.focus();
      return;
    }
    previouslyFocusedRef.current?.focus?.();
    previouslyFocusedRef.current = null;
  }, [open]);

  // Allow any part of the site (e.g. the FAQ "Ask our assistant" button)
  // to summon the widget via a global event. The ref is refreshed every
  // render (below, after handleOpen is defined) so the listener always
  // calls the latest closure.
  const handleOpenRef = useRef<() => void>(() => {});
  useEffect(() => {
    const listener = () => handleOpenRef.current();
    window.addEventListener("kt:concierge:open", listener);
    return () => window.removeEventListener("kt:concierge:open", listener);
  }, []);

  useEffect(() => {
    if (!open) return;

    const FOCUSABLE =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }

      // Focus trap. A dialog that lets Tab escape into the page behind it
      // leaves keyboard users navigating content they can't see, with no way
      // back — aria-modal tells assistive tech the rest is inert, so the
      // focus order has to actually match that claim.
      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (!panel.contains(active)) {
        // Focus drifted outside (e.g. after a re-render) — pull it back.
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, [messages, pending, reducedMotion]);

  function handleOpen() {
    setOpen(true);
    trackEvent("concierge_open");

    if (checkedAvailability) return;
    setCheckedAvailability(true);

    fetch("/api/concierge")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { enabled: boolean }) => {
        if (!data.enabled) {
          setOffline(true);
          setMessages([OFFLINE_MESSAGE]);
        } else {
          setMessages([GREETING]);
        }
      })
      .catch(() => {
        setOffline(true);
        setMessages([OFFLINE_MESSAGE]);
      });
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    if (offline) {
      setMessages((prev) => [...prev, { role: "user", content: trimmed }, OFFLINE_MESSAGE]);
      setInput("");
      return;
    }

    const nextMessages: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setPending(true);

    try {
      // Drop the client-side greeting (and any other leading assistant
      // messages) so the transcript sent to the server opens on a real user turn.
      const firstUser = nextMessages.findIndex((m) => m.role === "user");
      const history = nextMessages.slice(firstUser === -1 ? 0 : firstUser);

      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({
            role: m.role,
            content: m.content,
            ...(m.signature ? { signature: m.signature } : {}),
          })),
        }),
      });

      if (res.status === 503) {
        setOffline(true);
        setMessages((prev) => [...prev, OFFLINE_MESSAGE]);
        return;
      }

      if (!res.ok) {
        setMessages((prev) => [...prev, OFFLINE_MESSAGE]);
        return;
      }

      const data: {
        reply: string;
        services: ServiceLink[];
        show_booking: boolean;
        show_contact: boolean;
        signature?: string;
      } = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          services: data.services,
          showBooking: data.show_booking,
          showContact: data.show_contact,
          signature: data.signature,
        },
      ]);
    } catch {
      setMessages((prev) => [...prev, OFFLINE_MESSAGE]);
    } finally {
      setPending(false);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    void sendMessage(input);
  }

  // Keep the global-open listener pointed at the latest closure.
  handleOpenRef.current = handleOpen;

  const panelClassName = cn(
    "glass fixed inset-x-0 bottom-0 z-[80] flex max-h-[80vh] flex-col overflow-hidden rounded-t-panel",
    "md:inset-x-auto md:bottom-24 md:right-6 md:max-h-[560px] md:w-[380px] md:rounded-panel"
  );

  const panelBody = (
    <>
      <div className="flex items-center justify-between gap-3 rounded-t-panel bg-charcoal px-5 py-4 md:rounded-t-panel">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-mint" aria-hidden="true" />
          <div>
            <p className="font-heading text-sm font-semibold text-warm-white">
              Kinetic Assistant
            </p>
            <p className="text-xs text-silver">Guidance only — not medical advice</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close chat"
          className="rounded-pill p-1.5 text-warm-white/80 transition-colors hover:bg-white/10 hover:text-warm-white"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-warm-white/70 px-4 py-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
          >
            <div className="max-w-[85%] space-y-2">
              <div
                className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  message.role === "user"
                    ? "bg-mint/90 text-charcoal"
                    : "border border-silver/60 bg-white/90 text-charcoal"
                )}
              >
                {message.content}
              </div>

              {message.role === "assistant" &&
                (message.services?.length ||
                  message.showBooking ||
                  message.showContact) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {message.services?.map((service) => (
                      <Link
                        key={service.slug}
                        href={`/${service.slug}`}
                        onClick={() =>
                          trackEvent("concierge_service_click", { service: service.slug })
                        }
                        className="rounded-pill bg-sage/70 px-3 py-1.5 text-xs font-semibold text-deep-teal transition-colors hover:bg-sage"
                      >
                        {service.name}
                      </Link>
                    ))}
                    {message.showBooking && (
                      <a
                        href={janeBookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackEvent("concierge_book_click")}
                        className="rounded-pill bg-mint px-4 py-2 text-sm font-semibold text-charcoal shadow-button-hover"
                      >
                        Book Now
                      </a>
                    )}
                    {message.showContact && (
                      <>
                        <Link
                          href="/contact"
                          className="rounded-pill border border-deep-teal/30 bg-sage/40 px-3 py-1.5 text-xs font-semibold text-deep-teal transition-colors hover:border-deep-teal"
                        >
                          Contact Us
                        </Link>
                        <a
                          href={phoneHref}
                          className="inline-flex items-center gap-1 rounded-pill border border-silver/60 bg-white/80 px-3 py-1.5 text-xs font-semibold text-charcoal"
                        >
                          <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                          {clinic.phone}
                        </a>
                      </>
                    )}
                  </div>
                )}
            </div>
          </div>
        ))}

        {messages.length === 1 && messages[0] === GREETING && (
          <div className="flex flex-wrap gap-2 pt-1">
            {QUICK_REPLIES.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => void sendMessage(reply)}
                className="rounded-pill border border-deep-teal/30 bg-sage/40 px-3 py-1.5 text-sm text-charcoal transition-colors hover:border-deep-teal"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        {pending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl border border-silver/60 bg-white/90 px-4 py-3">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-charcoal/50" />
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-charcoal/50"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-charcoal/50"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}

        <div ref={endOfMessagesRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-silver/60 bg-white/90 px-3 py-3"
      >
        <label htmlFor="concierge-input" className="sr-only">
          Message the booking assistant
        </label>
        <input
          ref={inputRef}
          id="concierge-input"
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value.slice(0, MAX_INPUT_LENGTH))}
          maxLength={MAX_INPUT_LENGTH}
          placeholder="Type your message..."
          className="flex-1 rounded-pill border border-silver bg-white px-4 py-2.5 text-sm text-charcoal outline-none focus:border-deep-teal"
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          aria-label="Send message"
          className="rounded-pill bg-mint p-2.5 text-charcoal transition-opacity disabled:opacity-40"
        >
          <Send className="h-[18px] w-[18px]" aria-hidden="true" />
        </button>
      </form>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Not sure what to book? Chat with our booking assistant"
        className={cn(
          "fixed bottom-24 right-4 z-[75] flex items-center gap-2 rounded-pill bg-mint px-4 py-3.5 font-semibold text-charcoal shadow-button-hover transition-transform hover:scale-105",
          "md:bottom-6"
        )}
      >
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
        <span className="hidden sm:inline">Not sure what to book?</span>
      </button>

      <AnimatePresence>
        {open &&
          (reducedMotion ? (
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Booking assistant chat"
              className={panelClassName}
            >
              {panelBody}
            </div>
          ) : (
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Booking assistant chat"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.3, ease: easePremium }}
              className={panelClassName}
            >
              {panelBody}
            </motion.div>
          ))}
      </AnimatePresence>
    </>
  );
}
