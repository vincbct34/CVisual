import type { Metadata } from "next";
import { LandingShell } from "@/components/landing/landing-shell";
import { RegisterCta } from "@/components/landing/home-cta";
import {
  defaultLocale,
  isLocale,
  type Locale,
  withLocale,
} from "@/lib/i18n/config";
import "@/app/landing.css";

const COPY = {
  fr: {
    title: "Assistant IA",
    description:
      "Un assistant IA qui reformule, résume, traduit et score votre CV face à une offre. Compatible OpenAI, Gemini et Anthropic — votre clé reste sur votre appareil.",
    kicker: "Assistant intégré",
    h1: "L’IA qui",
    h1Em: "affûte",
    h1After: " votre CV",
    intro:
      "Reformuler, résumer, traduire, scorer face à une offre — un coup de main là où ça compte. Vous gardez la main : rien n’est publié sans votre validation.",
    trustStart: "Compatible avec vos propres clés —",
    trustEnd:
      "La clé reste sur votre appareil, jamais stockée sur nos serveurs.",
    cta: "Essayer l’assistant",
    apply: "Appliquer",
    ignore: "Ignorer",
    before: "« 12 projets web »",
    after: "« Pilotage de 12 projets web livrés dans les délais. »",
    atsTip: "+ Ajoutez « Agile » et « budget »",
    atsTipAfter: " pour mieux coller à l’offre visée.",
    caps: [
      {
        n: "01",
        h: "Reformulation",
        p: "Resserre et muscle vos expériences. Vos mots, en plus convaincants — jamais inventés.",
      },
      {
        n: "02",
        h: "Résumé de profil",
        p: "Génère une accroche à partir du contenu de votre CV, dans le ton attendu par les recruteurs.",
      },
      {
        n: "03",
        h: "Traduction",
        p: "Duplique votre CV dans une autre langue en conservant la structure, prêt pour une candidature à l’international.",
      },
      {
        n: "04",
        h: "Score ATS",
        p: "Compare votre CV à une offre et renvoie un score chiffré avec des conseils d’amélioration concrets.",
      },
      {
        n: "05",
        h: "Lettre de motivation",
        p: "Rédige un premier jet de lettre à partir de votre CV et de l’offre visée, en quelques secondes.",
      },
    ],
  },
  en: {
    title: "AI assistant",
    description:
      "An AI assistant that rewrites, summarizes, translates, and scores your resume against a job post. Compatible with OpenAI, Gemini, and Anthropic — your key stays on your device.",
    kicker: "Built-in assistant",
    h1: "AI that",
    h1Em: "sharpens",
    h1After: " your resume",
    intro:
      "Rewrite, summarize, translate, and score your resume against a job post where it matters. You stay in control: nothing is published without your approval.",
    trustStart: "Compatible with your own keys —",
    trustEnd: "Your key stays on your device, never stored on our servers.",
    cta: "Try the assistant",
    apply: "Apply",
    ignore: "Dismiss",
    before: "“12 web projects”",
    after: "“Led 12 web projects delivered on time.”",
    atsTip: "+ Add “Agile” and “budget”",
    atsTipAfter: " to better match the target role.",
    caps: [
      {
        n: "01",
        h: "Rewrite",
        p: "Tightens and strengthens your experience. Your words, more convincing — never invented.",
      },
      {
        n: "02",
        h: "Profile summary",
        p: "Generates a recruiter-ready profile summary from your resume content.",
      },
      {
        n: "03",
        h: "Translation",
        p: "Duplicates your resume into another language while preserving its structure, ready for international applications.",
      },
      {
        n: "04",
        h: "ATS score",
        p: "Compares your resume to a job post and returns a score with concrete improvement tips.",
      },
      {
        n: "05",
        h: "Cover letter",
        p: "Drafts a first cover letter from your resume and the target job post in seconds.",
      },
    ],
  },
} as const;

const PROVIDERS = ["OpenAI", "Gemini", "Anthropic"];

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
    alternates: { canonical: withLocale("/ia", locale) },
    openGraph: { title: copy.title, description: copy.description },
  };
}

export default async function IaPage({
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
            <span className="num">( IA )</span> {copy.kicker}
          </span>
          <h1 className="subhero-h">
            {copy.h1} <em>{copy.h1Em}</em>
            {copy.h1After}
          </h1>
          <p className="subhero-p">{copy.intro}</p>
          <p className="ia-trust">
            {copy.trustStart}{" "}
            {PROVIDERS.map((p, i) => (
              <span key={p}>
                <b>{p}</b>
                {i < PROVIDERS.length - 1 ? ", " : ". "}
              </span>
            ))}
            {copy.trustEnd}
          </p>
        </div>
      </section>

      <section className="ia-section">
        <div className="wrap ia-grid">
          <div className="cap-list">
            {copy.caps.map((c, i) => (
              <div
                className="cap-row reveal"
                key={c.n}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <span className="cap-num">{c.n}</span>
                <div>
                  <h3>{c.h}</h3>
                  <p>{c.p}</p>
                </div>
              </div>
            ))}
            <RegisterCta className="btn btn-ink" label={copy.cta} />
          </div>

          <div className="ia-demos reveal">
            <div className="ia-demo">
              <div className="ia-top">
                <span className="ia-badge">IA</span>
                <span className="ia-ttl">Reformulation</span>
              </div>
              <div className="ia-text">
                <span className="ia-before">{copy.before}</span>
                <b>{copy.after}</b>
              </div>
              <div className="ia-actions">
                <div className="ia-btn go">{copy.apply}</div>
                <div className="ia-btn">{copy.ignore}</div>
              </div>
            </div>

            <div className="ia-demo">
              <div className="ia-top">
                <span className="ia-badge">IA</span>
                <span className="ia-ttl">Score ATS</span>
              </div>
              <div className="ats-score">
                <span className="ats-num">82</span>
                <span className="ats-out">/ 100</span>
              </div>
              <div className="ia-text">
                <b>{copy.atsTip}</b>
                {copy.atsTipAfter}
              </div>
            </div>
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
