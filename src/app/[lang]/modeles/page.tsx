import type { Metadata } from "next";
import { LandingShell } from "@/components/landing/landing-shell";
import { RegisterCta } from "@/components/landing/home-cta";
import { getTemplate } from "@/components/templates";
import { TEMPLATE_SHOWCASE, sampleForTemplate } from "@/lib/sample-resume";
import {
  defaultLocale,
  isLocale,
  type Locale,
  withLocale,
} from "@/lib/i18n/config";
import "@/app/landing.css";

const COPY = {
  fr: {
    title: "Modèles de CV",
    description:
      "Cinq modèles de CV professionnels et optimisés ATS : Classique, Moderne, Minimal, Créatif et Professionnel. Personnalisables et exportables en PDF / DOCX.",
    kicker: "5 templates",
    h1: "Des modèles dessinés pour",
    h1Em: "se démarquer",
    intro:
      "Chaque modèle est conçu avec une hiérarchie typographique nette, lisible par les recruteurs comme par les robots ATS. Choisissez une base, personnalisez couleurs, polices et mise en page.",
    bandTitle: "Trouvez le vôtre",
    bandTitleEm: "en quelques clics",
    band: "Démarrez sur n’importe quel modèle — vous pourrez en changer à tout moment sans rien reperdre.",
    cta: "Commencer gratuitement",
  },
  en: {
    title: "Resume templates",
    description:
      "Five professional, ATS-optimized resume templates: Classic, Modern, Minimal, Creative, and Professional. Customizable and exportable to PDF / DOCX.",
    kicker: "5 templates",
    h1: "Templates designed to",
    h1Em: "stand out",
    intro:
      "Each template uses a clean typographic hierarchy, readable by recruiters and ATS systems alike. Pick a base, then customize colors, fonts, and layout.",
    bandTitle: "Find yours",
    bandTitleEm: "in a few clicks",
    band: "Start from any template — you can switch later without losing your content.",
    cta: "Start for free",
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
    alternates: { canonical: withLocale("/modeles", locale) },
    openGraph: { title: copy.title, description: copy.description },
  };
}

export default async function ModelesPage({
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
            <span className="num">( {copy.title} )</span> {copy.kicker}
          </span>
          <h1 className="subhero-h">
            {copy.h1} <em>{copy.h1Em}</em>
          </h1>
          <p className="subhero-p">{copy.intro}</p>
        </div>
      </section>

      <section className="tpl-section">
        <div className="wrap">
          <div className="tpl-grid">
            {TEMPLATE_SHOWCASE.map((t, i) => {
              const Template = getTemplate(t.key);
              return (
                <div
                  className="tpl-card reveal"
                  key={t.key}
                  style={{ transitionDelay: `${(i % 3) * 80}ms` }}
                >
                  <div className="tpl-meta">
                    <div>
                      <div className="tpl-name">{t.name}</div>
                      <div className="tpl-tag">{t.tagline}</div>
                    </div>
                    <span
                      className="tpl-dot"
                      style={{ background: t.color }}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="tpl-frame">
                    <div className="cv-scale">
                      <Template resume={sampleForTemplate(t.key, t.color)} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="tpl-band reveal">
            <div>
              <h3>
                {copy.bandTitle} <em>{copy.bandTitleEm}</em>
              </h3>
              <p>{copy.band}</p>
            </div>
            <RegisterCta className="btn btn-paper" label={copy.cta} />
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
