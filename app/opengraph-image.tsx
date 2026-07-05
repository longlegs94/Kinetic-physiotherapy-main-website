import { ImageResponse } from "next/og";

/**
 * Site-wide OpenGraph/social share image, generated at build time.
 * Applies to any route that doesn't define its own opengraph-image.
 */
export const runtime = "nodejs";
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
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "#72E0C0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#111416",
              fontSize: "40px",
              fontWeight: 800,
            }}
          >
            K
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: "#F7F5F0", fontSize: "30px", fontWeight: 800, letterSpacing: "1px" }}>
              KINETIC
            </span>
            <span style={{ color: "#72E0C0", fontSize: "16px", letterSpacing: "6px" }}>
              THERAPY
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
