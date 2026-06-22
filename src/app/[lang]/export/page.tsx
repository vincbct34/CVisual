import type { Metadata } from "next";
import { ClassicTemplate } from "@/components/templates/ClassicTemplate";
import { LandingShell } from "@/components/landing/landing-shell";
import { RegisterCta } from "@/components/landing/home-cta";
import { SAMPLE_RESUME } from "@/lib/sample-resume";
import {
  defaultLocale,
  isLocale,
  type Locale,
  withLocale,
} from "@/lib/i18n/config";
import "@/app/landing.css";

const COPY = {
  fr: {
    title: "Export PDF, DOCX & HTML",
    description:
      "Exportez votre CV en PDF haute fidélité, DOCX éditable, HTML autonome ou JSON réimportable. Le rendu est identique au pixel près à l’aperçu de l’éditeur.",
    kicker: "4 formats",
    h1: "Un fichier",
    h1Em: "prêt à partir",
    h1After: ", sans retouche",
    intro:
      "PDF, DOCX, HTML ou JSON — générés à la volée à partir du modèle réel. Le fichier exporté est identique, au pixel près, à l’aperçu que vous voyez dans l’éditeur.",
    doc: "CV — 2026",
    ready: "Prêt à exporter",
    cta: "Créer mon CV",
    formats: [
      {
        tag: "PDF",
        h: "PDF haute fidélité",
        p: "Le format à envoyer aux recruteurs. Rendu pixel-perfect via le vrai modèle, tailles et marges gérées par le CSS d’impression.",
      },
      {
        tag: "DOCX",
        h: "DOCX éditable",
        p: "Un document Word propre, structuré section par section — utile quand un cabinet exige un fichier modifiable.",
      },
      {
        tag: "HTML",
        h: "HTML autonome",
        p: "Une page unique, toutes les feuilles de style intégrées. Aucune requête externe : la mise en forme part avec le fichier.",
      },
      {
        tag: "JSON",
        h: "JSON réimportable",
        p: "Vos données brutes, propres et réimportables d’un clic. Idéal pour sauvegarder ou repartir d’une base.",
      },
    ],
  },
  en: {
    title: "PDF, DOCX & HTML export",
    description:
      "Export your resume as high-fidelity PDF, editable DOCX, standalone HTML, or reimportable JSON. The output matches the editor preview.",
    kicker: "4 formats",
    h1: "A file",
    h1Em: "ready to send",
    h1After: ", no touch-ups",
    intro:
      "PDF, DOCX, HTML, or JSON — generated from the real template. The exported file matches the editor preview down to the layout.",
    doc: "Resume — 2026",
    ready: "Ready to export",
    cta: "Create my resume",
    formats: [
      {
        tag: "PDF",
        h: "High-fidelity PDF",
        p: "The format to send recruiters. Pixel-perfect output from the real template, with print sizes and margins handled by CSS.",
      },
      {
        tag: "DOCX",
        h: "Editable DOCX",
        p: "A clean Word document, structured section by section — useful when an agency requires an editable file.",
      },
      {
        tag: "HTML",
        h: "Standalone HTML",
        p: "One self-contained page with all styles included. No external requests: the formatting travels with the file.",
      },
      {
        tag: "JSON",
        h: "Reimportable JSON",
        p: "Your raw data, clean and ready to reimport in one click. Ideal for backups or starting from a base.",
      },
    ],
  },
} as const;

function getLocale(lang: string): Locale {
  return isLocale(lang) ? lang : defaultLocale;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = getLocale(lang);
  const copy = COPY[locale];
  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: withLocale("/export", locale) },
    openGraph: { title: copy.title, description: copy.description },
  };
}

export default async function ExportPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const copy = COPY[getLocale(lang)];
  return (
    <LandingShell>
      <section className="subhero">
        <div className="wrap">
          <span className="kicker">
            <span className="num">( Export )</span> {copy.kicker}
          </span>
          <h1 className="subhero-h">
            {copy.h1} <em>{copy.h1Em}</em>
            {copy.h1After}
          </h1>
          <p className="subhero-p">{copy.intro}</p>
        </div>
      </section>

      <section className="exp-section">
        <div className="wrap exp-grid">
          <div className="exp-stage reveal">
            <div className="exp-doc">
              <div className="r-top">
                <span>{copy.doc}</span>
                <span className="tab">{copy.ready}</span>
              </div>
              <div className="exp-doc-frame">
                <div className="cv-scale">
                  <ClassicTemplate resume={SAMPLE_RESUME} />
                </div>
              </div>
            </div>
            <div className="exp-chips" aria-hidden="true">
              {copy.formats.map((f) => (
                <span className="exp-chip" key={f.tag}>
                  {f.tag}
                </span>
              ))}
            </div>
          </div>

          <div className="fmt-list">
            {copy.formats.map((f, i) => (
              <div
                className="fmt-row reveal"
                key={f.tag}
                style={{ transitionDelay: `${i * 70}ms` }}
              >
                <span className="fmt-badge">{f.tag}</span>
                <div>
                  <h3>{f.h}</h3>
                  <p>{f.p}</p>
                </div>
              </div>
            ))}
            <RegisterCta className="btn btn-ink" label={copy.cta} />
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
