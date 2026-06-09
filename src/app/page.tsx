import Link from "next/link";
import { ClassicTemplate } from "@/components/templates/ClassicTemplate";
import { LandingShell, Arrow } from "@/components/landing/landing-shell";
import { SAMPLE_RESUME } from "@/lib/sample-resume";
import "./landing.css";

const COPY = {
  eyebrow: "Générateur de CV — Gratuit",
  headline: "Créez le CV qui vous",
  headlineAccent: "ressemble",
  subtitle:
    "Des modèles pensés pour les recruteurs, optimisés ATS, entièrement personnalisables et assistés par IA. Un CV professionnel en quelques minutes.",
  ctaPrimary: "Commencer dès maintenant",
  ctaSecondary: "Se connecter",
};

const FEATURES = [
  {
    n: "01",
    h: "Templates pro",
    p: "Cinq modèles dessinés avec des recruteurs. Une hiérarchie typographique nette, lisible par les machines comme par les humains.",
    l: "Voir les modèles",
    href: "/modeles",
  },
  {
    n: "02",
    h: "Export multi-format",
    p: "PDF haute fidélité ou DOCX éditable, générés à la volée. Le fichier est prêt à partir, sans retouche.",
    l: "PDF · DOCX",
    href: "/export",
  },
  {
    n: "03",
    h: "IA embarquée",
    p: "Un assistant qui reformule, traduit et resserre vos expériences — vos mots, en plus convaincants.",
    l: "Découvrir l’IA",
    href: "/ia",
  },
];

function ResumeMockup() {
  return (
    <div className="doc-stage reveal">
      <div className="resume">
        <div className="r-top">
          <span>CV — 2026</span>
          <span className="tab">Modèle Classique · Édition</span>
        </div>
        <div className="resume-window">
          <div className="resume-page">
            <ClassicTemplate resume={SAMPLE_RESUME} />
          </div>
        </div>
      </div>

      <div className="cal cal-ats r">
        Optimisé <b>ATS</b>
      </div>
      <div className="cal cal-exp r">
        Export <b>PDF · DOCX</b>
      </div>

      <div className="ia-card">
        <div className="ia-top">
          <span className="ia-badge">IA</span>
          <span className="ia-ttl">Suggestion</span>
        </div>
        <div className="ia-text">
          « 12 projets web » →{" "}
          <b>« 12 projets web livrés dans les délais et le budget. »</b>
        </div>
        <div className="ia-actions">
          <div className="ia-btn go">Appliquer</div>
          <div className="ia-btn">Ignorer</div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <LandingShell ticker>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-l reveal in">
            <span className="kicker">
              <span className="num">( 01 )</span> {COPY.eyebrow}
            </span>
            <h1 className="headline">
              {COPY.headline} <em>{COPY.headlineAccent}</em>
            </h1>
            <p className="subtitle">{COPY.subtitle}</p>
            <div className="hero-cta">
              <Link className="btn btn-ink" href="/register">
                {COPY.ctaPrimary} <Arrow />
              </Link>
              <Link className="btn btn-line" href="/login">
                {COPY.ctaSecondary}
              </Link>
            </div>
            <div className="hero-meta">
              <span className="rule" />
              Totalement gratuit
            </div>
          </div>
          <ResumeMockup />
        </div>
      </section>

      <section className="feat" id="feat">
        <div className="wrap">
          <div className="feat-head reveal">
            <h2 className="feat-title">
              Un CV soigné, des candidatures qui se <em>démarquent</em>
            </h2>
            <p className="sub">
              ( 02 ) — Les bons modèles, les bons formats et un coup de main de
              l’IA. Vous gardez l’essentiel : décrocher l’entretien.
            </p>
          </div>
          <div className="feat-grid">
            {FEATURES.map((f, i) => (
              <Link
                className="feat-col reveal"
                key={f.n}
                href={f.href}
                style={{ transitionDelay: `${i * 90}ms` }}
              >
                <div className="feat-num">{f.n}</div>
                <h3>{f.h}</h3>
                <p>{f.p}</p>
                <span className="ln">
                  {f.l} <Arrow size={13} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="wrap">
          <div className="cta-panel reveal">
            <span className="watermark">CV</span>
            <span className="kicker">
              <span className="num">( 03 )</span> Prêt à postuler
            </span>
            <h2>
              Votre prochain poste tient sur <em>une page</em>
            </h2>
            <div className="crow">
              <Link className="btn btn-paper" href="/register">
                {COPY.ctaPrimary} <Arrow />
              </Link>
              <Link className="btn btn-ghost-d" href="/login">
                {COPY.ctaSecondary}
              </Link>
            </div>
            <div className="cta-note">
              Totalement gratuit · Sans carte bancaire · Aucun spam
            </div>
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
