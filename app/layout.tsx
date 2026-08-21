import type { Metadata, Viewport } from "next";
import { Sora, Inter } from "next/font/google";
import "./globals.css";
import { SITE_URL, SITE_NAME } from "@/lib/seo";
import { getClinic } from "@/lib/content/store";

/**
 * Root layout — deliberately just the document shell.
 *
 * The site has two surfaces that share nothing but fonts and CSS: the public
 * marketing pages under `(site)`, and the staff admin portal under `admin`.
 * The marketing chrome (header, footer, sticky booking bar, AI concierge
 * bubble) lives in `app/(site)/layout.tsx` rather than here, because a "Book
 * Now" header above a staff login screen is wrong — and a layout cannot
 * subtract what a parent already rendered.
 *
 * Keep this file free of anything visitor-facing. Whatever is added here is
 * added to the admin portal too.
 */

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  // The clinic can rename itself from the staff portal, so the title template
  // every page inherits is read per request rather than baked into the bundle.
  // getClinic falls back to the bundled copy when the database is unreachable.
  const { name } = await getClinic();
  const siteName = name || SITE_NAME;
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${siteName} Maple Ridge | Physio, Massage, Chiro, Kinesiology & Acupuncture`,
      template: `%s | ${siteName}`,
    },
    description: `${siteName} is a multidisciplinary clinic in Maple Ridge offering physiotherapy, massage therapy, chiropractic, kinesiology, acupuncture, ICBC support, and recovery-focused care.`,
    keywords: [
      "physiotherapy Maple Ridge",
      "massage therapy Maple Ridge",
      "chiropractor Maple Ridge",
      "ICBC physio Maple Ridge",
      "acupuncture Maple Ridge",
      "kinesiology Maple Ridge",
    ],
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
      ],
    },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: "#111416",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-CA" className={`${sora.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
