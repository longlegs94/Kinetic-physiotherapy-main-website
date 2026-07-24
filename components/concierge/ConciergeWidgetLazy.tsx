"use client";

import dynamic from "next/dynamic";

// ConciergeWidget pulls in framer-motion's AnimatePresence/motion chat panel,
// which is only needed once a visitor opens the launcher. Loading it lazily
// keeps that code out of the JS bundle every page ships by default.
const ConciergeWidget = dynamic(
  () => import("./ConciergeWidget").then((mod) => mod.ConciergeWidget),
  { ssr: false }
);

export function ConciergeWidgetLazy() {
  return <ConciergeWidget />;
}
