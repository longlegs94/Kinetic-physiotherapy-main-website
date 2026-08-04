import type { Metadata, Viewport } from "next";
import { Sora, Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { StickyMobileBookingBar } from "@/components/layout/StickyMobileBookingBar";
import { ConciergeWidgetLoader } from "@/components/concierge/ConciergeWidgetLoader";
import { Analytics } from "@/components/analytics/Analytics";
import { JsonLd } from "@/components/ui/JsonLd";
import { localBusinessSchema } from "@/lib/schema";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Kinetic Therapy Clinic Maple Ridge | Physio, Massage, Chiro, Kinesiology & Acupuncture",
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Kinetic Therapy is a multidisciplinary clinic in Maple Ridge offering physiotherapy, massage therapy, chiropractic, kinesiology, acupuncture, ICBC support, and recovery-focused care.",
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
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <JsonLd data={localBusinessSchema()} />
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <StickyMobileBookingBar />
        <ConciergeWidgetLoader />
        <Analytics />
      </body>
    </html>
  );
}
