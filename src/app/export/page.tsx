import type { Metadata } from "next";
import Link from "next/link";
import { ClassicTemplate } from "@/components/templates/ClassicTemplate";
import { LandingShell, Arrow } from "@/components/landing/landing-shell";
import { SAMPLE_RESUME } from "@/lib/sample-resume";
import "../landing.css";

export const metadata: Metadata = {
  title: "Export PDF, DOCX & HTML",
  description:
    "Exportez votre CV en PDF haute fidélité, DOCX éditable, HTML autonome ou JSON réimportable. Le rendu est identique au pixel près à l’aperçu de l’éditeur.",
};

const FORMATS = [
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
];

export default function ExportPage() {
  return (
    <LandingShell>
      <section className="subhero">
        <div className="wrap">
          <span className="kicker">
            <span className="num">( Export )</span> 4 formats
          </span>
          <h1 className="subhero-h">
            Un fichier <em>prêt à partir</em>, sans retouche
          </h1>
          <p className="subhero-p">
            PDF, DOCX, HTML ou JSON — générés à la volée à partir du modèle
            réel. Le fichier exporté est identique, au pixel près, à l’aperçu
            que vous voyez dans l’éditeur.
          </p>
        </div>
      </section>

      <section className="exp-section">
        <div className="wrap exp-grid">
          <div className="exp-stage reveal">
            <div className="exp-doc">
              <div className="r-top">
                <span>CV — 2026</span>
                <span className="tab">Prêt à exporter</span>
              </div>
              <div className="exp-doc-frame">
                <div className="cv-scale">
                  <ClassicTemplate resume={SAMPLE_RESUME} />
                </div>
              </div>
            </div>
            <div className="exp-chips" aria-hidden="true">
              {FORMATS.map((f) => (
                <span className="exp-chip" key={f.tag}>
                  {f.tag}
                </span>
              ))}
            </div>
          </div>

          <div className="fmt-list">
            {FORMATS.map((f, i) => (
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
            <Link className="btn btn-ink" href="/register">
              Créer mon CV <Arrow />
            </Link>
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
