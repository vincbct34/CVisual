"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClassicTemplate } from "@/components/templates/ClassicTemplate";
import type { Resume, Section } from "@/types/resume";
import "./landing.css";

// Sample CV rendered in the hero — the real ClassicTemplate component, so the
// mockup always matches a template that actually ships in the app.
const SAMPLE_SECTIONS: Section[] = [
  {
    id: "s-profile",
    type: "profile",
    title: "Profil",
    order: 0,
    visible: true,
    content: {
      fullName: "Camille Laurent",
      jobTitle: "Cheffe de projet digital",
      summary: "",
      email: "camille.laurent@email.fr",
      phone: "06 12 34 56 78",
      location: "Lyon, FR",
      website: "",
    },
  },
  {
    id: "s-exp",
    type: "experience",
    title: "Expérience",
    order: 1,
    visible: true,
    content: {
      items: [
        {
          id: "e1",
          company: "Atelier Numérique",
          position: "Cheffe de projet",
          startDate: "2023",
          endDate: "",
          current: true,
          description:
            "Pilotage de 12 projets web livrés dans les délais et le budget.",
        },
        {
          id: "e2",
          company: "Studio Pixel",
          position: "Chargée de projet",
          startDate: "2021",
          endDate: "2023",
          current: false,
          description: "Suivi de 8 comptes clients et reporting hebdomadaire.",
        },
      ],
    },
  },
  {
    id: "s-edu",
    type: "education",
    title: "Formation",
    order: 2,
    visible: true,
    content: {
      items: [
        {
          id: "ed1",
          institution: "Université Lyon 3",
          degree: "Master Management de projet",
          field: "",
          startDate: "",
          endDate: "2021",
          description: "",
        },
      ],
    },
  },
  {
    id: "s-skills",
    type: "skills",
    title: "Compétences",
    order: 3,
    visible: true,
    content: {
      display: "tags",
      items: [
        { id: "sk1", name: "Gestion de projet", level: 5 },
        { id: "sk2", name: "Figma", level: 4 },
        { id: "sk3", name: "Notion", level: 4 },
        { id: "sk4", name: "Jira", level: 3 },
        { id: "sk5", name: "Agile", level: 4 },
      ],
    },
  },
];

const SAMPLE_RESUME: Resume = {
  id: "sample",
  title: "CV — Camille Laurent",
  language: "fr",
  template: "classic",
  isPublic: false,
  createdAt: "",
  updatedAt: "",
  style: {
    primaryColor: "#9e4a2d",
    fontFamily: "var(--sans)",
    fontSize: 14,
  },
  sections: SAMPLE_SECTIONS,
};

const COPY = {
  eyebrow: "Générateur de CV — Gratuit",
  headline: "Créez le CV qui vous",
  headlineAccent: "ressemble",
  subtitle:
    "Des modèles pensés pour les recruteurs, optimisés ATS, entièrement personnalisables et assistés par IA. Un CV professionnel en quelques minutes.",
  ctaPrimary: "Commencer gratuitement",
  ctaSecondary: "Se connecter",
};

const BADGES = [
  "5 templates",
  "Export PDF / DOCX",
  "Multi-langue",
  "ATS-friendly",
  "IA intégrée",
];

const FEATURES = [
  {
    n: "01",
    h: "Templates pro",
    p: "Cinq modèles dessinés avec des recruteurs. Une hiérarchie typographique nette, lisible par les machines comme par les humains.",
    l: "Voir les modèles",
  },
  {
    n: "02",
    h: "Export multi-format",
    p: "PDF haute fidélité ou DOCX éditable, générés à la volée. Le fichier est prêt à partir, sans retouche.",
    l: "PDF · DOCX",
  },
  {
    n: "03",
    h: "IA embarquée",
    p: "Un assistant qui reformule, traduit et resserre vos expériences — vos mots, en plus convaincants.",
    l: "Découvrir l’IA",
  },
];

function Arrow({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function Logo() {
  return (
    <Link className="logo" href="/">
      CVisual<span className="reg">®</span>
    </Link>
  );
}

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

function TickerItem() {
  return (
    <div className="ticker-item">
      {BADGES.map((b, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
          <span className="sep">◆</span>
          <span className="txt">{b}</span>
        </span>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    document
      .querySelectorAll(".landing .reveal")
      .forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="landing">
      <header className={`mast${scrolled ? " scrolled" : ""}`}>
        <div className="wrap mast-inner">
          <Logo />
          <nav className="mast-right">
            <a className="mast-link hide-sm" href="#feat">
              Fonctionnalités
            </a>
            <Link className="mast-link" href="/login">
              Connexion
            </Link>
            <Link className="btn btn-ink btn-sm" href="/register">
              Créer un compte
            </Link>
          </nav>
        </div>
      </header>

      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          <TickerItem />
          <TickerItem />
        </div>
      </div>

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
              Gratuit · Sans carte bancaire
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
              <div
                className="feat-col reveal"
                key={f.n}
                style={{ transitionDelay: `${i * 90}ms` }}
              >
                <div className="feat-num">{f.n}</div>
                <h3>{f.h}</h3>
                <p>{f.p}</p>
                <span className="ln">
                  {f.l} <Arrow size={13} />
                </span>
              </div>
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
              Gratuit · Sans carte bancaire · Annulable à tout moment
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <Logo />
              <div className="foot-tag">Le CV, repensé.</div>
            </div>
            <div className="foot-links">
              <Link href="/login">Connexion</Link>
              <Link href="/register">Créer un compte</Link>
              <a href="#feat">Fonctionnalités</a>
            </div>
          </div>
          <div className="foot-copy">
            <span>© {new Date().getFullYear()} CVisual</span>
            <span>Générateur de CV &amp; lettre de motivation</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
