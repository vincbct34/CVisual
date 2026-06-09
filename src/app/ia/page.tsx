import type { Metadata } from "next";
import Link from "next/link";
import { LandingShell, Arrow } from "@/components/landing/landing-shell";
import "../landing.css";

export const metadata: Metadata = {
  title: "Assistant IA",
  description:
    "Un assistant IA qui reformule, résume, traduit et score votre CV face à une offre. Compatible OpenAI, Gemini et Anthropic — votre clé reste sur votre appareil.",
};

const CAPS = [
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
];

const PROVIDERS = ["OpenAI", "Gemini", "Anthropic"];

export default function IaPage() {
  return (
    <LandingShell>
      <section className="subhero">
        <div className="wrap">
          <span className="kicker">
            <span className="num">( IA )</span> Assistant intégré
          </span>
          <h1 className="subhero-h">
            L’IA qui <em>affûte</em> votre CV
          </h1>
          <p className="subhero-p">
            Reformuler, résumer, traduire, scorer face à une offre — un coup de
            main là où ça compte. Vous gardez la main : rien n’est publié sans
            votre validation.
          </p>
          <p className="ia-trust">
            Compatible avec vos propres clés —{" "}
            {PROVIDERS.map((p, i) => (
              <span key={p}>
                <b>{p}</b>
                {i < PROVIDERS.length - 1 ? ", " : ". "}
              </span>
            ))}
            La clé reste sur votre appareil, jamais stockée sur nos serveurs.
          </p>
        </div>
      </section>

      <section className="ia-section">
        <div className="wrap ia-grid">
          <div className="cap-list">
            {CAPS.map((c, i) => (
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
            <Link className="btn btn-ink" href="/register">
              Essayer l’assistant <Arrow />
            </Link>
          </div>

          <div className="ia-demos reveal">
            <div className="ia-demo">
              <div className="ia-top">
                <span className="ia-badge">IA</span>
                <span className="ia-ttl">Reformulation</span>
              </div>
              <div className="ia-text">
                <span className="ia-before">« 12 projets web »</span>
                <b>« Pilotage de 12 projets web livrés dans les délais. »</b>
              </div>
              <div className="ia-actions">
                <div className="ia-btn go">Appliquer</div>
                <div className="ia-btn">Ignorer</div>
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
                <b>+ Ajoutez « Agile » et « budget »</b> pour mieux coller à
                l’offre visée.
              </div>
            </div>
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
