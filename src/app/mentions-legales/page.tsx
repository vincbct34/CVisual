import type { Metadata } from "next";
import { LandingShell } from "@/components/landing/landing-shell";
import "../landing.css";

export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Mentions légales de CVisual : éditeur, hébergeur et informations de contact.",
};

export default function MentionsLegalesPage() {
  return (
    <LandingShell>
      <section className="subhero">
        <div className="wrap">
          <span className="kicker">
            <span className="num">( Légal )</span> Informations
          </span>
          <h1 className="subhero-h">
            Mentions <em>légales</em>
          </h1>
          <p className="subhero-p">
            Informations légales relatives à l’éditeur et à l’hébergeur du site
            CVisual, conformément à la loi n° 2004-575 du 21 juin 2004 pour la
            confiance dans l’économie numérique (LCEN).
          </p>
        </div>
      </section>

      <section className="legal">
        <div className="wrap">
          <div className="legal-prose">
            <h2>Éditeur du site</h2>
            <p>
              Le site CVisual est édité par <strong>404Factory</strong>,
              micro-entreprise (entrepreneur individuel), immatriculée au
              Registre National des Entreprises (RNE) sous le numéro SIRET 987
              983 939 00016.
            </p>
            <ul>
              <li>Siège social : 20 Avenue de la Gare, 34770 Gigean, France</li>
              <li>
                TVA non applicable, article 293 B du Code général des impôts
                (franchise en base)
              </li>
              <li>Directeur de la publication : Vincent BICHAT</li>
              <li>
                Contact :{" "}
                <a href="mailto:factory404@outlook.fr">factory404@outlook.fr</a>
              </li>
            </ul>

            <h2>Hébergeur</h2>
            <p>
              Le site est hébergé par <strong>Railway Corporation</strong>, 548
              Market St Suite 68956, San Francisco, California 94104, États-Unis
              —{" "}
              <a
                href="https://railway.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                railway.com
              </a>
              .
            </p>

            <h2>Propriété intellectuelle</h2>
            <p>
              L’ensemble des éléments du site (textes, graphismes, logo, modèles
              de CV, code) est la propriété exclusive de l’éditeur ou de ses
              partenaires et est protégé par le droit de la propriété
              intellectuelle. Toute reproduction ou représentation, totale ou
              partielle, sans autorisation écrite préalable est interdite.
            </p>
            <p>
              Les contenus que vous créez (CV, lettres de motivation) restent
              votre propriété exclusive.
            </p>

            <h2>Responsabilité</h2>
            <p>
              L’éditeur s’efforce d’assurer l’exactitude des informations
              diffusées mais ne saurait être tenu responsable des erreurs,
              omissions ou d’une indisponibilité du service. L’utilisateur est
              seul responsable du contenu qu’il saisit et de l’usage qu’il fait
              des documents générés.
            </p>

            <h2>Données personnelles</h2>
            <p>
              Le traitement de vos données personnelles est décrit dans notre{" "}
              <a href="/confidentialite">Politique de confidentialité</a>.
            </p>

            <p className="legal-updated">Dernière mise à jour : 9 juin 2026</p>
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
