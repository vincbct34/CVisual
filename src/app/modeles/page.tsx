import type { Metadata } from "next";
import Link from "next/link";
import { LandingShell, Arrow } from "@/components/landing/landing-shell";
import { getTemplate } from "@/components/templates";
import { TEMPLATE_SHOWCASE, sampleForTemplate } from "@/lib/sample-resume";
import "../landing.css";

export const metadata: Metadata = {
  title: "Modèles de CV",
  description:
    "Cinq modèles de CV professionnels et optimisés ATS : Classique, Moderne, Minimal, Créatif et Professionnel. Personnalisables et exportables en PDF / DOCX.",
};

export default function ModelesPage() {
  return (
    <LandingShell>
      <section className="subhero">
        <div className="wrap">
          <span className="kicker">
            <span className="num">( Modèles )</span> 5 templates
          </span>
          <h1 className="subhero-h">
            Des modèles dessinés pour <em>se démarquer</em>
          </h1>
          <p className="subhero-p">
            Chaque modèle est conçu avec une hiérarchie typographique nette,
            lisible par les recruteurs comme par les robots ATS. Choisissez une
            base, personnalisez couleurs, polices et mise en page.
          </p>
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
                Trouvez le vôtre <em>en quelques clics</em>
              </h3>
              <p>
                Démarrez sur n’importe quel modèle — vous pourrez en changer à
                tout moment sans rien reperdre.
              </p>
            </div>
            <Link className="btn btn-paper" href="/register">
              Commencer gratuitement <Arrow />
            </Link>
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
