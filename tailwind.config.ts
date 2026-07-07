import type { Config } from "tailwindcss";

/**
 * Tailwind theme mapped from content/design-tokens.json.
 * If you change a hex value in design-tokens.json, mirror it here so the
 * utility classes stay in sync (Tailwind cannot read JSON at build time
 * without extra tooling, so these are kept intentionally simple).
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./content/**/*.{md,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        mint: "#72E0C0",
        // Deepened from the brand board's #0F8F7A to meet WCAG AA (4.5:1) for
        // small text on light backgrounds — the board hex failed at ~3.7:1.
        "deep-teal": "#0A6E5C",
        charcoal: "#111416",
        "soft-black": "#1B2023",
        "warm-white": "#F7F5F0",
        silver: "#D8DAD7",
        sage: "#DDEFE8",
        "cta-orange": "#F4A261",
      },
      fontFamily: {
        heading: ["var(--font-sora)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        pill: "999px",
        card: "28px",
        panel: "36px",
      },
      boxShadow: {
        card: "0 16px 50px rgba(17, 20, 22, 0.08)",
        "dark-glow": "0 24px 80px rgba(114, 224, 192, 0.10)",
        "button-hover": "0 10px 30px rgba(114, 224, 192, 0.35)",
      },
      maxWidth: {
        container: "1240px",
      },
      fontSize: {
        "hero-lg": ["clamp(2.5rem, 6vw, 4.75rem)", { lineHeight: "1.02", letterSpacing: "-0.02em" }],
        "page-h1": ["clamp(2.375rem, 5vw, 4rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "section-h2": ["clamp(1.875rem, 3.5vw, 3.25rem)", { lineHeight: "1.1", letterSpacing: "-0.015em" }],
        "card-title": ["clamp(1.25rem, 2vw, 1.5rem)", { lineHeight: "1.2" }],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
