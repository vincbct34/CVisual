import type { Metadata } from "next";
import Link from "next/link";
import { ClassicTemplate } from "@/components/templates/ClassicTemplate";
import { LandingShell, Arrow } from "@/components/landing/landing-shell";
import { HomeCta } from "@/components/landing/home-cta";
import { SAMPLE_RESUME } from "@/lib/sample-resume";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { makeT } from "@/lib/i18n/translate";
import { withLocale, isLocale, defaultLocale } from "@/lib/i18n/config";
import "@/app/landing.css";

// Title/description/OpenGraph inherit the [lang] layout; only the canonical is
// page-specific (canonical is set per-page, never on the root layout).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return { alternates: { canonical: `/${lang}` } };
}

function ResumeMockup({ t }: { t: (k: string) => string }) {
  return (
    <div className="doc-stage reveal">
      <div className="resume">
        <div className="r-top">
          <span>{t("landing.mockupDoc")}</span>
          <span className="tab">{t("landing.mockupTab")}</span>
        </div>
        <div className="resume-window">
          <div className="resume-page">
            <ClassicTemplate resume={SAMPLE_RESUME} />
          </div>
        </div>
      </div>

      <div className="cal cal-ats r">
        {t("landing.mockupAts")} <b>ATS</b>
      </div>
      <div className="cal cal-exp r">
        {t("landing.mockupExport")} <b>PDF · DOCX</b>
      </div>

      <div className="ia-card">
        <div className="ia-top">
          <span className="ia-badge">{t("nav.ai")}</span>
          <span className="ia-ttl">{t("landing.mockupIaTitle")}</span>
        </div>
        <div className="ia-text">
          {t("landing.mockupIaBefore")} → <b>{t("landing.mockupIaAfter")}</b>
        </div>
        <div className="ia-actions">
          <div className="ia-btn go">{t("landing.mockupApply")}</div>
          <div className="ia-btn">{t("landing.mockupIgnore")}</div>
        </div>
      </div>
    </div>
  );
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  const t = makeT(dict);
  const ctaPrimary = t("landing.ctaPrimary");
  const ctaSecondary = t("landing.ctaSecondary");

  const features = [
    {
      n: "01",
      h: t("landing.feat1Title"),
      p: t("landing.feat1Body"),
      l: t("landing.feat1Link"),
      href: "/modeles",
    },
    {
      n: "02",
      h: t("landing.feat2Title"),
      p: t("landing.feat2Body"),
      l: t("landing.feat2Link"),
      href: "/export",
    },
    {
      n: "03",
      h: t("landing.feat3Title"),
      p: t("landing.feat3Body"),
      l: t("landing.feat3Link"),
      href: "/ia",
    },
  ];

  return (
    <LandingShell ticker>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-l reveal in">
            <span className="kicker">
              <span className="num">( 01 )</span> {t("landing.eyebrow")}
            </span>
            <h1 className="headline">
              {t("landing.headline")} <em>{t("landing.headlineAccent")}</em>
            </h1>
            <p className="subtitle">{t("landing.subtitle")}</p>
            <div className="hero-cta">
              <HomeCta
                primaryClass="btn btn-ink"
                secondaryClass="btn btn-line"
                primaryLabel={ctaPrimary}
                secondaryLabel={ctaSecondary}
              />
            </div>
            <div className="hero-meta">
              <span className="rule" />
              {t("landing.heroMetaFree")}
            </div>
          </div>
          <ResumeMockup t={t} />
        </div>
      </section>

      <section className="feat" id="feat">
        <div className="wrap">
          <div className="feat-head reveal">
            <h2 className="feat-title">
              {t("landing.featTitle")} <em>{t("landing.featTitleAccent")}</em>
            </h2>
            <p className="sub">{t("landing.featSub")}</p>
          </div>
          <div className="feat-grid">
            {features.map((f, i) => (
              <Link
                className="feat-col reveal"
                key={f.n}
                href={withLocale(f.href, locale)}
                style={{ transitionDelay: `${i * 90}ms` }}
              >
                <div className="feat-num">{f.n}</div>
                <h3>{f.h}</h3>
                <p>{f.p}</p>
                <span className="ln">
                  {f.l} <Arrow size={13} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="wrap">
          <div className="cta-panel reveal">
            <span className="watermark">CV</span>
            <span className="kicker">
              <span className="num">( 03 )</span> {t("landing.ctaKicker")}
            </span>
            <h2>
              {t("landing.ctaTitle")} <em>{t("landing.ctaTitleAccent")}</em>
            </h2>
            <div className="crow">
              <HomeCta
                primaryClass="btn btn-paper"
                secondaryClass="btn btn-ghost-d"
                primaryLabel={ctaPrimary}
                secondaryLabel={ctaSecondary}
              />
            </div>
            <div className="cta-note">{t("landing.ctaNote")}</div>
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
