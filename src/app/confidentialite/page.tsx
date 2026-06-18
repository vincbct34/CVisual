import type { Metadata } from "next";
import { LandingShell } from "@/components/landing/landing-shell";
import "../landing.css";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Comment CVisual collecte, utilise et protège vos données personnelles, conformément au RGPD.",
  alternates: { canonical: "/confidentialite" },
};

export default function ConfidentialitePage() {
  return (
    <LandingShell>
      <section className="subhero">
        <div className="wrap">
          <span className="kicker">
            <span className="num">( Légal )</span> RGPD
          </span>
          <h1 className="subhero-h">
            Politique de <em>confidentialité</em>
          </h1>
          <p className="subhero-p">
            Cette politique explique quelles données nous traitons, pourquoi, et
            les droits dont vous disposez, conformément au Règlement général sur
            la protection des données (RGPD).
          </p>
        </div>
      </section>

      <section className="legal">
        <div className="wrap">
          <div className="legal-prose">
            <h2>Responsable du traitement</h2>
            <p>
              Le responsable du traitement est <strong>404Factory</strong>{" "}
              (micro-entreprise), 20 Avenue de la Gare, 34770 Gigean, France.
              Pour toute question relative à vos données :{" "}
              <a href="mailto:factory404@outlook.fr">factory404@outlook.fr</a>.
            </p>

            <h2>Données que nous collectons</h2>
            <h3>Données de compte</h3>
            <p>
              Lors de votre inscription, nous collectons votre{" "}
              <strong>nom</strong>, votre <strong>adresse e-mail</strong> et
              votre <strong>mot de passe</strong> (stocké de façon chiffrée via
              un hachage bcrypt — nous ne connaissons jamais votre mot de passe
              en clair).
            </p>
            <h3>Contenu que vous créez</h3>
            <p>
              Les CV et lettres de motivation que vous rédigez — y compris les
              informations personnelles que vous y saisissez (coordonnées,
              expériences, photo, etc.) — sont enregistrés afin de vous
              permettre de les modifier, exporter et partager.
            </p>
            <h3>Clés API d’intelligence artificielle</h3>
            <p>
              Si vous utilisez les fonctions d’IA, votre clé API (OpenAI, Gemini
              ou Anthropic) est stockée{" "}
              <strong>uniquement dans votre navigateur</strong> (localStorage)
              et n’est <strong>jamais enregistrée sur nos serveurs</strong>. Les
              appels à OpenAI et Gemini partent directement de votre navigateur
              ; les appels à Anthropic transitent par un proxy technique qui
              transmet la clé à chaque requête sans la conserver.
            </p>
            <h3>Données techniques</h3>
            <p>
              Pour le fonctionnement de l’authentification, nous utilisons des
              cookies et jetons (voir « Cookies » ci-dessous). Nous pouvons
              également conserver des journaux techniques limités à des fins de
              sécurité et de prévention des abus.
            </p>

            <h2>Finalités et bases légales</h2>
            <ul>
              <li>
                Fournir le service (création, sauvegarde, export de documents) —{" "}
                <strong>exécution du contrat</strong>.
              </li>
              <li>
                Gérer votre compte et son authentification —{" "}
                <strong>exécution du contrat</strong>.
              </li>
              <li>
                Envoyer des e-mails transactionnels (réinitialisation de mot de
                passe) — <strong>exécution du contrat</strong>.
              </li>
              <li>
                Assurer la sécurité et prévenir la fraude —{" "}
                <strong>intérêt légitime</strong>.
              </li>
            </ul>

            <h2>Sous-traitants et destinataires</h2>
            <p>
              Vos données sont hébergées par{" "}
              <strong>Railway Corporation</strong> (railway.com). L’envoi
              d’e-mails transactionnels est assuré via{" "}
              <strong>Google Workspace</strong> (Google Ireland Limited).
              Lorsque vous utilisez l’IA, le contenu envoyé est traité par le
              fournisseur que vous avez choisi (OpenAI, Google ou Anthropic)
              selon sa propre politique de confidentialité. Nous ne vendons ni
              ne louons vos données.
            </p>

            <h2>Durée de conservation</h2>
            <p>
              Vos données de compte et vos documents sont conservés tant que
              votre compte est actif. Lorsque vous supprimez votre compte, vos
              données (CV, lettres, jetons) sont{" "}
              <strong>définitivement supprimées</strong>. Les jetons de session
              expirés et de réinitialisation sont purgés automatiquement.
            </p>

            <h2>Vos droits</h2>
            <p>
              Conformément au RGPD, vous disposez d’un droit d’accès, de
              rectification, d’effacement, de limitation, d’opposition et de
              portabilité. Vous pouvez rectifier vos informations depuis votre
              page <a href="/settings/account">Mon compte</a>, ou supprimer
              l’intégralité de votre compte depuis cette même page. Pour exercer
              vos autres droits, contactez{" "}
              <a href="mailto:factory404@outlook.fr">factory404@outlook.fr</a>.
              Vous pouvez également introduire une réclamation auprès de la CNIL
              (www.cnil.fr).
            </p>

            <h2>Cookies</h2>
            <p>
              Nous utilisons uniquement des cookies strictement nécessaires au
              fonctionnement du service : un cookie{" "}
              <strong>access_token</strong> (session, ~15 min) et un cookie{" "}
              <strong>refresh_token</strong> (httpOnly, ~7 jours) pour vous
              maintenir connecté. Nous n’utilisons pas de cookies publicitaires
              ni de traceurs tiers.
            </p>
            <p>
              Le bouton « Offrez-moi un café » présent en pied de page charge
              une image depuis les serveurs de Buy Me a Coffee
              (buymeacoffee.com). Cette requête peut transmettre votre adresse
              IP à ce prestataire ; aucun cookie n’est déposé de notre fait à
              cette occasion.
            </p>

            <h2>Sécurité</h2>
            <p>
              Les mots de passe sont hachés (bcrypt), l’authentification repose
              sur des jetons signés à durée limitée, et l’accès aux ressources
              est contrôlé par propriétaire. Aucune mesure n’étant infaillible,
              nous vous recommandons un mot de passe fort et unique.
            </p>

            <p className="legal-updated">Dernière mise à jour : 9 juin 2026</p>
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
