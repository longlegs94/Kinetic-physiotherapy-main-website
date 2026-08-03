"use client";

import dynamic from "next/dynamic";

// Closed by default on every page load — deferring its (framer-motion-heavy)
// JS to a separate chunk keeps it off the critical path for the ~95% of
// visits that never open it. `ssr: false` requires a Client Component
// boundary, hence this thin wrapper around the real widget.
export const ConciergeWidgetLazy = dynamic(
  () => import("./ConciergeWidget").then((mod) => mod.ConciergeWidget),
  { ssr: false }
);
