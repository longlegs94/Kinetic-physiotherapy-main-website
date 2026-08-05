import { ImageResponse } from "next/og";

/**
 * Site-wide OpenGraph/social share image, generated at build time.
 * Applies to any route that doesn't define its own opengraph-image.
 */
export const runtime = "nodejs";
// The image has no per-request input, so it's rendered once at build time.
// Required explicitly for `output: "export"`, a no-op otherwise.
export const dynamic = "force-static";
export const alt = "Kinetic Therapy Clinic — Maple Ridge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#111416",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <svg width="72" height="72" viewBox="0 0 64 64">
            <defs>
              <linearGradient id="flow" x1="54" y1="6" x2="6" y2="50" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0F8F7A" />
                <stop offset="0.45" stopColor="#2CC9A6" />
                <stop offset="1" stopColor="#72E0C0" />
              </linearGradient>
              <linearGradient id="leg" x1="22" y1="34" x2="56" y2="62" gradientUnits="userSpaceOnUse">
                <stop stopColor="#2CC9A6" />
                <stop offset="1" stopColor="#0F8F7A" />
              </linearGradient>
            </defs>
            <rect x="12" y="4" width="9" height="56" rx="4.5" fill="#F7F5F0" />
            <path
              d="M54 6 C40 13 29 25 21.5 34.5 C15.5 42 9.5 46.5 4.5 48.5"
              stroke="url(#flow)"
              strokeWidth="8.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M23 35 C32 39.5 43 49 53.5 59"
              stroke="url(#leg)"
              strokeWidth="8.5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: "#F7F5F0", fontSize: "30px", fontWeight: 800, letterSpacing: "1px" }}>
              KINETIC
            </span>
            <span style={{ color: "#72E0C0", fontSize: "18px", letterSpacing: "2px" }}>
              Therapy
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ color: "#F7F5F0", fontSize: "68px", fontWeight: 800, lineHeight: 1.05 }}>
            Move better. Recover stronger.
          </span>
          <span style={{ color: "#72E0C0", fontSize: "68px", fontWeight: 800, lineHeight: 1.05 }}>
            Live pain-free.
          </span>
        </div>

        <span style={{ color: "#D8DAD7", fontSize: "26px" }}>
          Multidisciplinary care in Maple Ridge, BC · Physio · Massage · Chiro · Kinesiology · Acupuncture
        </span>
      </div>
    ),
    { ...size }
  );
}
