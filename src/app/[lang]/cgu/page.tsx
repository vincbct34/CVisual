import type { Metadata } from "next";
import { LandingShell } from "@/components/landing/landing-shell";
import "../landing.css";

export const metadata: Metadata = {
  title: "Conditions générales d’utilisation",
  description:
    "Conditions générales d’utilisation du service CVisual : accès, compte, responsabilités et propriété.",
  alternates: { canonical: "/cgu" },
};

export default function CGUPage() {
  return (
    <LandingShell>
      <section className="subhero">
        <div className="wrap">
          <span className="kicker">
            <span className="num">( Légal )</span> CGU
          </span>
          <h1 className="subhero-h">
            Conditions générales <em>d’utilisation</em>
          </h1>
          <p className="subhero-p">
            Les présentes conditions régissent l’accès et l’utilisation du
            service CVisual. En créant un compte, vous les acceptez sans
            réserve.
          </p>
        </div>
      </section>

      <section className="legal">
        <div className="wrap">
          <div className="legal-prose">
            <h2>1. Objet</h2>
            <p>
              CVisual est un service en ligne permettant de créer,
              personnaliser, exporter et partager des CV et lettres de
              motivation, avec une assistance optionnelle par intelligence
              artificielle. Les présentes conditions générales d’utilisation
              (les « CGU ») définissent les modalités de mise à disposition du
              service et les obligations des utilisateurs.
            </p>

            <h2>2. Accès au service</h2>
            <p>
              Le service est accessible gratuitement. Certaines fonctionnalités
              nécessitent la création d’un compte. L’accès peut être suspendu ou
              interrompu pour maintenance ou pour des raisons techniques sans
              que la responsabilité de l’éditeur ne puisse être engagée.
            </p>

            <h2>3. Compte utilisateur</h2>
            <p>
              Vous vous engagez à fournir des informations exactes lors de
              l’inscription et à préserver la confidentialité de vos
              identifiants. Toute activité réalisée depuis votre compte est
              réputée effectuée par vous. Vous pouvez supprimer votre compte à
              tout moment depuis la page{" "}
              <a href="/settings/account">Mon compte</a>.
            </p>

            <h2>4. Fonctions d’intelligence artificielle</h2>
            <p>
              L’utilisation de l’IA requiert votre propre clé API auprès d’un
              fournisseur tiers (OpenAI, Google ou Anthropic). Vous êtes
              responsable de cette clé et du respect des conditions de ce
              fournisseur. Les contenus générés par l’IA peuvent comporter des
              inexactitudes ; il vous appartient de les relire et de les
              valider.
            </p>

            <h2>5. Obligations de l’utilisateur</h2>
            <p>Vous vous engagez à ne pas :</p>
            <ul>
              <li>
                utiliser le service à des fins illicites, frauduleuses ou
                trompeuses ;
              </li>
              <li>
                saisir des contenus portant atteinte aux droits de tiers ou
                contraires à l’ordre public ;
              </li>
              <li>
                tenter de perturber, contourner ou compromettre la sécurité du
                service.
              </li>
            </ul>

            <h2>6. Propriété intellectuelle</h2>
            <p>
              Le service, sa structure et ses modèles restent la propriété de
              l’éditeur. Les contenus que vous créez demeurent votre propriété.
              Vous conservez l’entière responsabilité des informations que vous
              renseignez dans vos documents.
            </p>

            <h2>7. Responsabilité</h2>
            <p>
              Le service est fourni « en l’état ». L’éditeur ne garantit pas
              l’absence d’erreurs ni une disponibilité ininterrompue, et ne
              saurait être tenu responsable des dommages indirects résultant de
              l’utilisation du service ou de la perte de données. Il vous est
              recommandé d’exporter régulièrement vos documents.
            </p>

            <h2>8. Données personnelles</h2>
            <p>
              Le traitement de vos données est décrit dans la{" "}
              <a href="/confidentialite">Politique de confidentialité</a>.
            </p>

            <h2>9. Modification des CGU</h2>
            <p>
              L’éditeur peut modifier les présentes CGU à tout moment. La
              version applicable est celle en vigueur au moment de votre
              utilisation du service.
            </p>

            <h2>10. Droit applicable</h2>
            <p>
              Les présentes CGU sont soumises au droit français. Tout litige
              relève de la compétence des tribunaux de Montpellier, sauf
              disposition légale impérative contraire.
            </p>

            <p className="legal-updated">Dernière mise à jour : 9 juin 2026</p>
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
