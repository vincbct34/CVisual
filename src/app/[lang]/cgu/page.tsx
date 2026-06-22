import type { Metadata } from "next";
import { Link } from "@/components/i18n/link";
import { LandingShell } from "@/components/landing/landing-shell";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import "@/app/landing.css";

const COPY = {
  fr: {
    metaTitle: "Conditions générales d’utilisation",
    metaDesc:
      "Conditions générales d’utilisation du service CVisual : accès, compte, responsabilités et propriété.",
    kicker: "CGU",
    h1: "Conditions générales",
    h1em: "d’utilisation",
    intro:
      "Les présentes conditions régissent l’accès et l’utilisation du service CVisual. En créant un compte, vous les acceptez sans réserve.",
    s1h: "1. Objet",
    s1p: "CVisual est un service en ligne permettant de créer, personnaliser, exporter et partager des CV et lettres de motivation, avec une assistance optionnelle par intelligence artificielle. Les présentes conditions générales d’utilisation (les « CGU ») définissent les modalités de mise à disposition du service et les obligations des utilisateurs.",
    s2h: "2. Accès au service",
    s2p: "Le service est accessible gratuitement. Certaines fonctionnalités nécessitent la création d’un compte. L’accès peut être suspendu ou interrompu pour maintenance ou pour des raisons techniques sans que la responsabilité de l’éditeur ne puisse être engagée.",
    s3h: "3. Compte utilisateur",
    s3p1: "Vous vous engagez à fournir des informations exactes lors de l’inscription et à préserver la confidentialité de vos identifiants. Toute activité réalisée depuis votre compte est réputée effectuée par vous. Vous pouvez supprimer votre compte à tout moment depuis la page ",
    s3link: "Mon compte",
    s3p2: ".",
    s4h: "4. Fonctions d’intelligence artificielle",
    s4p: "L’utilisation de l’IA requiert votre propre clé API auprès d’un fournisseur tiers (OpenAI, Google ou Anthropic). Vous êtes responsable de cette clé et du respect des conditions de ce fournisseur. Les contenus générés par l’IA peuvent comporter des inexactitudes ; il vous appartient de les relire et de les valider.",
    s5h: "5. Obligations de l’utilisateur",
    s5p: "Vous vous engagez à ne pas :",
    s5li1:
      "utiliser le service à des fins illicites, frauduleuses ou trompeuses ;",
    s5li2:
      "saisir des contenus portant atteinte aux droits de tiers ou contraires à l’ordre public ;",
    s5li3:
      "tenter de perturber, contourner ou compromettre la sécurité du service.",
    s6h: "6. Propriété intellectuelle",
    s6p: "Le service, sa structure et ses modèles restent la propriété de l’éditeur. Les contenus que vous créez demeurent votre propriété. Vous conservez l’entière responsabilité des informations que vous renseignez dans vos documents.",
    s7h: "7. Responsabilité",
    s7p: "Le service est fourni « en l’état ». L’éditeur ne garantit pas l’absence d’erreurs ni une disponibilité ininterrompue, et ne saurait être tenu responsable des dommages indirects résultant de l’utilisation du service ou de la perte de données. Il vous est recommandé d’exporter régulièrement vos documents.",
    s8h: "8. Données personnelles",
    s8p1: "Le traitement de vos données est décrit dans la ",
    s8link: "Politique de confidentialité",
    s8p2: ".",
    s9h: "9. Modification des CGU",
    s9p: "L’éditeur peut modifier les présentes CGU à tout moment. La version applicable est celle en vigueur au moment de votre utilisation du service.",
    s10h: "10. Droit applicable",
    s10p: "Les présentes CGU sont soumises au droit français. Tout litige relève de la compétence des tribunaux de Montpellier, sauf disposition légale impérative contraire.",
    updated: "Dernière mise à jour : 9 juin 2026",
  },
  en: {
    metaTitle: "Terms of Service",
    metaDesc:
      "CVisual terms of service: access, account, responsibilities and ownership.",
    kicker: "Terms",
    h1: "Terms of",
    h1em: "Service",
    intro:
      "These terms govern access to and use of the CVisual service. By creating an account, you accept them without reservation.",
    s1h: "1. Purpose",
    s1p: "CVisual is an online service for creating, customizing, exporting and sharing resumes and cover letters, with optional artificial-intelligence assistance. These terms of service (the “Terms”) define how the service is made available and the obligations of users.",
    s2h: "2. Access to the service",
    s2p: "The service is available free of charge. Some features require creating an account. Access may be suspended or interrupted for maintenance or technical reasons without any liability on the part of the publisher.",
    s3h: "3. User account",
    s3p1: "You agree to provide accurate information when registering and to keep your credentials confidential. Any activity carried out from your account is deemed to be performed by you. You can delete your account at any time from the ",
    s3link: "My account",
    s3p2: " page.",
    s4h: "4. Artificial-intelligence features",
    s4p: "Using AI requires your own API key from a third-party provider (OpenAI, Google or Anthropic). You are responsible for this key and for complying with that provider's terms. AI-generated content may contain inaccuracies; it is up to you to review and validate it.",
    s5h: "5. User obligations",
    s5p: "You agree not to:",
    s5li1: "use the service for unlawful, fraudulent or deceptive purposes;",
    s5li2:
      "enter content that infringes third-party rights or is contrary to public order;",
    s5li3:
      "attempt to disrupt, circumvent or compromise the security of the service.",
    s6h: "6. Intellectual property",
    s6p: "The service, its structure and its templates remain the property of the publisher. The content you create remains your property. You retain full responsibility for the information you enter in your documents.",
    s7h: "7. Liability",
    s7p: "The service is provided “as is”. The publisher does not guarantee the absence of errors or uninterrupted availability, and cannot be held liable for indirect damages resulting from use of the service or loss of data. You are advised to export your documents regularly.",
    s8h: "8. Personal data",
    s8p1: "The processing of your data is described in the ",
    s8link: "Privacy Policy",
    s8p2: ".",
    s9h: "9. Changes to the Terms",
    s9p: "The publisher may change these Terms at any time. The applicable version is the one in force at the time you use the service.",
    s10h: "10. Governing law",
    s10p: "These Terms are governed by French law. Any dispute falls under the jurisdiction of the courts of Montpellier, unless a mandatory legal provision states otherwise.",
    updated: "Last updated: June 9, 2026",
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const c = COPY[isLocale(lang) ? (lang as Locale) : defaultLocale];
  return {
    title: c.metaTitle,
    description: c.metaDesc,
    alternates: { canonical: `/${lang}/cgu` },
  };
}

export default async function CGUPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const c = COPY[isLocale(lang) ? (lang as Locale) : defaultLocale];

  return (
    <LandingShell>
      <section className="subhero">
        <div className="wrap">
          <span className="kicker">
            <span className="num">( {lang === "en" ? "Legal" : "Légal"} )</span>{" "}
            {c.kicker}
          </span>
          <h1 className="subhero-h">
            {c.h1} <em>{c.h1em}</em>
          </h1>
          <p className="subhero-p">{c.intro}</p>
        </div>
      </section>

      <section className="legal">
        <div className="wrap">
          <div className="legal-prose">
            <h2>{c.s1h}</h2>
            <p>{c.s1p}</p>

            <h2>{c.s2h}</h2>
            <p>{c.s2p}</p>

            <h2>{c.s3h}</h2>
            <p>
              {c.s3p1}
              <Link href="/settings/account">{c.s3link}</Link>
              {c.s3p2}
            </p>

            <h2>{c.s4h}</h2>
            <p>{c.s4p}</p>

            <h2>{c.s5h}</h2>
            <p>{c.s5p}</p>
            <ul>
              <li>{c.s5li1}</li>
              <li>{c.s5li2}</li>
              <li>{c.s5li3}</li>
            </ul>

            <h2>{c.s6h}</h2>
            <p>{c.s6p}</p>

            <h2>{c.s7h}</h2>
            <p>{c.s7p}</p>

            <h2>{c.s8h}</h2>
            <p>
              {c.s8p1}
              <Link href="/confidentialite">{c.s8link}</Link>
              {c.s8p2}
            </p>

            <h2>{c.s9h}</h2>
            <p>{c.s9p}</p>

            <h2>{c.s10h}</h2>
            <p>{c.s10p}</p>

            <p className="legal-updated">{c.updated}</p>
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
