"use client";

import dynamic from "next/dynamic";

// `ssr: false` is only allowed inside a Client Component, hence this thin
// wrapper — see components/concierge/ConciergeWidget.tsx for the widget
// itself. Keeping the widget out of the server-rendered HTML and initial
// client bundle is worthwhile because it's closed by default and pulls in
// framer-motion's AnimatePresence for a panel most visitors never open.
const ConciergeWidget = dynamic(
  () => import("./ConciergeWidget").then((mod) => mod.ConciergeWidget),
  { ssr: false }
);

export function ConciergeWidgetLoader() {
  return <ConciergeWidget />;
}
