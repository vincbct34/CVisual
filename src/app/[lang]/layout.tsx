import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LanguageProvider } from "@/components/i18n/language-provider";
import { SiteFooter } from "@/components/site-footer";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { locales, isLocale } from "@/lib/i18n/config";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const META: Record<string, { title: string; description: string }> = {
  fr: {
    title: "CVisual — Créateur de CV professionnels",
    description:
      "Créez des CV professionnels, ATS-friendly et personnalisables, avec assistance IA et export PDF / DOCX.",
  },
  en: {
    title: "CVisual — Professional resume builder",
    description:
      "Build professional, ATS-friendly, customizable resumes with AI assistance and PDF / DOCX export.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const meta = META[lang] ?? META.fr;
  return {
    title: { default: meta.title, template: "%s | CVisual" },
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      locale: lang === "en" ? "en_US" : "fr_FR",
    },
    twitter: { title: meta.title, description: meta.description },
    alternates: {
      canonical: `${APP_URL}/${lang}`,
      languages: {
        fr: `${APP_URL}/fr`,
        en: `${APP_URL}/en`,
      },
    },
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  return (
    <LanguageProvider locale={lang} dict={dict}>
      {children}
      <SiteFooter />
      <InstallPrompt />
    </LanguageProvider>
  );
}
