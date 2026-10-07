import { ImageResponse } from "next/og";

export const alt = "Prime 60. Build the man. Build the life.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The link preview shown when the site is shared on social or in messages. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#141a21",
          color: "#eceae4",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, fontSize: 36 }}>
          <span style={{ fontFamily: "Helvetica, Arial, sans-serif", color: "#a4acb6" }}>Prime</span>
          <span style={{ color: "#d4b57a", fontSize: 56 }}>60</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 88, lineHeight: 1.05, letterSpacing: -2 }}>
            <span>You built the career.</span>
            <span>Now build the man.</span>
          </div>
          <div style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: 32, color: "#a4acb6" }}>
            A five-minute daily system for men 50 to 65. Free for life for the first 100 members.
          </div>
        </div>
        <div style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: 28, color: "#5fa3a6" }}>
          prime60.colindesilva.com
        </div>
      </div>
    ),
    size,
  );
}
