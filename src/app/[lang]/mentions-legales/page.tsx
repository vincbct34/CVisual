import type { Metadata } from "next";
import { LandingShell } from "@/components/landing/landing-shell";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import "@/app/landing.css";

const COPY = {
  fr: {
    metaTitle: "Mentions légales",
    metaDesc:
      "Mentions légales de CVisual : éditeur, hébergeur et informations de contact.",
    kicker: "Informations",
    h1: "Mentions",
    h1em: "légales",
    intro:
      "Informations légales relatives à l’éditeur et à l’hébergeur du site CVisual, conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique (LCEN).",
    body: `
      <h2>Éditeur du site</h2>
      <p>Le site CVisual est édité par <strong>404Factory</strong>, micro-entreprise (entrepreneur individuel), immatriculée au Registre National des Entreprises (RNE) sous le numéro SIRET 987 983 939 00016.</p>
      <ul>
        <li>Siège social : 20 Avenue de la Gare, 34770 Gigean, France</li>
        <li>TVA non applicable, article 293 B du Code général des impôts (franchise en base)</li>
        <li>Directeur de la publication : Vincent BICHAT</li>
        <li>Contact : <a href="mailto:factory404@outlook.fr">factory404@outlook.fr</a></li>
      </ul>
      <h2>Hébergeur</h2>
      <p>Le site est hébergé par <strong>Railway Corporation</strong>, 548 Market St Suite 68956, San Francisco, California 94104, États-Unis — <a href="https://railway.com" target="_blank" rel="noopener noreferrer">railway.com</a>.</p>
      <h2>Propriété intellectuelle</h2>
      <p>L’ensemble des éléments du site (textes, graphismes, logo, modèles de CV, code) est la propriété exclusive de l’éditeur ou de ses partenaires et est protégé par le droit de la propriété intellectuelle. Toute reproduction ou représentation, totale ou partielle, sans autorisation écrite préalable est interdite.</p>
      <p>Les contenus que vous créez (CV, lettres de motivation) restent votre propriété exclusive.</p>
      <h2>Responsabilité</h2>
      <p>L’éditeur s’efforce d’assurer l’exactitude des informations diffusées mais ne saurait être tenu responsable des erreurs, omissions ou d’une indisponibilité du service. L’utilisateur est seul responsable du contenu qu’il saisit et de l’usage qu’il fait des documents générés.</p>
      <h2>Données personnelles</h2>
      <p>Le traitement de vos données personnelles est décrit dans notre <a href="/fr/confidentialite">Politique de confidentialité</a>.</p>
      <p class="legal-updated">Dernière mise à jour : 9 juin 2026</p>
    `,
  },
  en: {
    metaTitle: "Legal notice",
    metaDesc: "CVisual legal notice: publisher, host and contact information.",
    kicker: "Information",
    h1: "Legal",
    h1em: "notice",
    intro:
      "Legal information about the publisher and host of the CVisual site, in accordance with French law no. 2004-575 of 21 June 2004 on confidence in the digital economy (LCEN).",
    body: `
      <h2>Site publisher</h2>
      <p>The CVisual site is published by <strong>404Factory</strong>, a sole proprietorship, registered with the French National Business Register (RNE) under SIRET number 987 983 939 00016.</p>
      <ul>
        <li>Registered office: 20 Avenue de la Gare, 34770 Gigean, France</li>
        <li>VAT not applicable, article 293 B of the French General Tax Code (base exemption)</li>
        <li>Publication director: Vincent BICHAT</li>
        <li>Contact: <a href="mailto:factory404@outlook.fr">factory404@outlook.fr</a></li>
      </ul>
      <h2>Host</h2>
      <p>The site is hosted by <strong>Railway Corporation</strong>, 548 Market St Suite 68956, San Francisco, California 94104, USA — <a href="https://railway.com" target="_blank" rel="noopener noreferrer">railway.com</a>.</p>
      <h2>Intellectual property</h2>
      <p>All elements of the site (text, graphics, logo, resume templates, code) are the exclusive property of the publisher or its partners and are protected by intellectual-property law. Any reproduction or representation, in whole or in part, without prior written authorization is prohibited.</p>
      <p>The content you create (resumes, cover letters) remains your exclusive property.</p>
      <h2>Liability</h2>
      <p>The publisher strives to ensure the accuracy of the information published but cannot be held liable for errors, omissions or any unavailability of the service. The user is solely responsible for the content they enter and the use they make of the generated documents.</p>
      <h2>Personal data</h2>
      <p>The processing of your personal data is described in our <a href="/en/confidentialite">Privacy Policy</a>.</p>
      <p class="legal-updated">Last updated: June 9, 2026</p>
    `,
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
    alternates: { canonical: `/${lang}/mentions-legales` },
  };
}

export default async function MentionsLegalesPage({
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
          <div
            className="legal-prose"
            dangerouslySetInnerHTML={{ __html: c.body }}
          />
        </div>
      </section>
    </LandingShell>
  );
}
