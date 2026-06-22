import { ImageResponse } from "next/og";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";

// Editorial OG card. Colors are literal hex (satori does not parse the OKLCH
// design tokens in globals.css): paper / ink / brique accent.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

const PAPER = "#f7f4ee";
const INK = "#2b2622";
const INK_SOFT = "#6b6258";
const BRIQUE = "#b65436";

const COPY: Record<
  Locale,
  {
    alt: string;
    kicker: string;
    description: string;
    features: string;
  }
> = {
  fr: {
    alt: "CVisual - Creez des CV professionnels, ATS-friendly, avec IA et export PDF / DOCX",
    kicker: "Createur de CV",
    description:
      "CV professionnels, ATS-friendly et personnalisables - avec assistance IA et export PDF / DOCX.",
    features: "IA · ATS · PDF · DOCX",
  },
  en: {
    alt: "CVisual - Build professional, ATS-friendly resumes with AI and PDF / DOCX export",
    kicker: "Resume builder",
    description:
      "Professional, ATS-friendly, customizable resumes - with AI assistance and PDF / DOCX export.",
    features: "AI · ATS · PDF · DOCX",
  },
};

function localeFrom(value: string): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export function generateImageMetadata({
  params,
}: {
  params: { lang: string };
}) {
  const locale = localeFrom(params.lang);

  return [
    {
      id: locale,
      alt: COPY[locale].alt,
      size,
      contentType,
    },
  ];
}

export default async function Image({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const copy = COPY[localeFrom(lang)];

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
        {copy.kicker}
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
          {copy.description}
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
        <span style={{ display: "flex" }}>{copy.features}</span>
      </div>
    </div>,
    { ...size },
  );
}
