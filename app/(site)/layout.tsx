import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { StickyMobileBookingBar } from "@/components/layout/StickyMobileBookingBar";
import { ConciergeWidget } from "@/components/concierge/ConciergeWidget";
import { aiAssistantEnabled } from "@/lib/ai-config";
import { Analytics } from "@/components/analytics/Analytics";
import { JsonLd } from "@/components/ui/JsonLd";
import { localBusinessSchema } from "@/lib/schema";
import { SiteDataProvider } from "@/components/providers/SiteDataProvider";
import { getClinic, resolveBookingUrl } from "@/lib/content/store";

/**
 * Chrome for the public marketing site.
 *
 * `(site)` is a route group, so it contributes nothing to the URL — every page
 * below still lives at the path it always did. It exists so the staff portal
 * at /admin can opt out of all of this: header, footer, booking bar, concierge
 * bubble, analytics, and the LocalBusiness schema are visitor-facing and have
 * no business wrapping a login form.
 *
 * This is also where the clinic's contact details enter the tree. Reading them
 * once here and passing them down means a phone number changed in the portal
 * reaches the header, the footer, the booking bar and the structured data in
 * the same render, rather than each of them holding its own build-time copy.
 */
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clinic = await getClinic();
  const janeBookingUrl = resolveBookingUrl(clinic);

  return (
    <SiteDataProvider clinic={clinic} janeBookingUrl={janeBookingUrl}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <JsonLd data={localBusinessSchema(clinic, janeBookingUrl)} />
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      <StickyMobileBookingBar />
      {/* Omitted entirely when the assistant is off, so the floating bubble
          never appears only to report itself unavailable. */}
      {aiAssistantEnabled && <ConciergeWidget />}
      <Analytics />
    </SiteDataProvider>
  );
}
