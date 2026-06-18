import { ImageResponse } from "next/og";

// Editorial OG card. Colors are literal hex (satori does not parse the OKLCH
// design tokens in globals.css): paper / ink / brique accent.
export const alt =
  "CVisual — Créez des CV professionnels, ATS-friendly, avec IA et export PDF / DOCX";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

const PAPER = "#f7f4ee";
const INK = "#2b2622";
const INK_SOFT = "#6b6258";
const BRIQUE = "#b65436";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: PAPER,
        color: INK,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 26,
          letterSpacing: 6,
          textTransform: "uppercase",
          color: INK_SOFT,
        }}
      >
        Créateur de CV
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            fontSize: 150,
            fontWeight: 800,
            letterSpacing: -4,
            lineHeight: 1,
          }}
        >
          CVisual
        </div>
        <div
          style={{
            display: "flex",
            width: 220,
            height: 10,
            marginTop: 28,
            background: BRIQUE,
          }}
        />
        <div
          style={{
            display: "flex",
            fontSize: 40,
            lineHeight: 1.3,
            marginTop: 36,
            maxWidth: 880,
            color: INK_SOFT,
          }}
        >
          CV professionnels, ATS-friendly et personnalisables — avec assistance
          IA et export PDF / DOCX.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 26,
          color: INK_SOFT,
          borderTop: `2px solid ${INK}`,
          paddingTop: 24,
        }}
      >
        <span style={{ display: "flex" }}>cvisual</span>
        <span style={{ display: "flex" }}>IA · ATS · PDF · DOCX</span>
      </div>
    </div>,
    { ...size },
  );
}
