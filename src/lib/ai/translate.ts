import { callAI } from "./ai-client";
import { translateContentPrompt } from "./prompts";
import { parseJsonResponse } from "./json";
import { PROVIDER_MODELS, type AIProvider } from "./types";
import type { Locale } from "@/lib/i18n/config";
import type { Section } from "@/types/resume";

const LANG_NAMES: Record<Locale, Record<string, string>> = {
  fr: {
    fr: "français",
    en: "anglais",
    es: "espagnol",
    de: "allemand",
    it: "italien",
    pt: "portugais",
    nl: "néerlandais",
    ar: "arabe",
    zh: "chinois",
    ja: "japonais",
  },
  en: {
    fr: "French",
    en: "English",
    es: "Spanish",
    de: "German",
    it: "Italian",
    pt: "Portuguese",
    nl: "Dutch",
    ar: "Arabic",
    zh: "Chinese",
    ja: "Japanese",
  },
};

// Static translation of standard section titles
const SECTION_TITLE_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    Profil: "Profile",
    "Expériences professionnelles": "Work Experience",
    Formation: "Education",
    Compétences: "Skills",
    Langues: "Languages",
    Projets: "Projects",
    Certifications: "Certifications",
    "Centres d'intérêt": "Interests",
  },
  es: {
    Profil: "Perfil",
    "Expériences professionnelles": "Experiencia Profesional",
    Formation: "Formación",
    Compétences: "Competencias",
    Langues: "Idiomas",
    Projets: "Proyectos",
    Certifications: "Certificaciones",
    "Centres d'intérêt": "Intereses",
  },
  de: {
    Profil: "Profil",
    "Expériences professionnelles": "Berufserfahrung",
    Formation: "Ausbildung",
    Compétences: "Kompetenzen",
    Langues: "Sprachen",
    Projets: "Projekte",
    Certifications: "Zertifizierungen",
    "Centres d'intérêt": "Interessen",
  },
  it: {
    Profil: "Profilo",
    "Expériences professionnelles": "Esperienza Lavorativa",
    Formation: "Formazione",
    Compétences: "Competenze",
    Langues: "Lingue",
    Projets: "Progetti",
    Certifications: "Certificazioni",
    "Centres d'intérêt": "Interessi",
  },
  pt: {
    Profil: "Perfil",
    "Expériences professionnelles": "Experiência Profissional",
    Formation: "Formação",
    Compétences: "Competências",
    Langues: "Idiomas",
    Projets: "Projetos",
    Certifications: "Certificações",
    "Centres d'intérêt": "Interesses",
  },
  nl: {
    Profil: "Profiel",
    "Expériences professionnelles": "Werkervaring",
    Formation: "Opleiding",
    Compétences: "Vaardigheden",
    Langues: "Talen",
    Projets: "Projecten",
    Certifications: "Certificeringen",
    "Centres d'intérêt": "Interesses",
  },
  ar: {
    Profil: "الملف الشخصي",
    "Expériences professionnelles": "الخبرة المهنية",
    Formation: "التعليم",
    Compétences: "المهارات",
    Langues: "اللغات",
    Projets: "المشاريع",
    Certifications: "الشهادات",
    "Centres d'intérêt": "الاهتمامات",
  },
  zh: {
    Profil: "个人简介",
    "Expériences professionnelles": "工作经历",
    Formation: "教育背景",
    Compétences: "技能",
    Langues: "语言",
    Projets: "项目",
    Certifications: "证书",
    "Centres d'intérêt": "兴趣爱好",
  },
  ja: {
    Profil: "プロフィール",
    "Expériences professionnelles": "職歴",
    Formation: "学歴",
    Compétences: "スキル",
    Langues: "言語",
    Projets: "プロジェクト",
    Certifications: "資格",
    "Centres d'intérêt": "趣味",
  },
};

// Profile fields that must never be sent to the translator: the base64 photo
// (huge, breaks the JSON response) and contact fields that shouldn't change.
const PRESERVE_KEYS = new Set(["photoBase64", "email", "phone", "website"]);

function translateSectionTitle(title: string, targetLang: string): string {
  return SECTION_TITLE_TRANSLATIONS[targetLang]?.[title] ?? title;
}

/**
 * Translate all sections of a resume to the target language.
 * Returns the translated sections (new content + translated titles).
 */
export interface TranslateResult {
  sections: { id: string; title: string; content: Record<string, unknown> }[];
  failedSections: string[];
}

export async function translateSections(
  sections: Section[],
  fromLang: string,
  toLang: string,
  apiKey: string,
  onProgress?: (current: number, total: number) => void,
  provider: AIProvider = "gemini",
  locale: Locale = "fr",
): Promise<TranslateResult> {
  const names = LANG_NAMES[locale];
  const fromName = names[fromLang] || fromLang;
  const toName = names[toLang] || toLang;
  const failedSections: string[] = [];
  const fastModel = PROVIDER_MODELS[provider].fast;
  let completed = 0;

  const results = await Promise.all(
    sections.map(async (section) => {
      const translatedTitle = translateSectionTitle(section.title, toLang);
      // Keep non-translatable / heavy fields (e.g. the base64 photo) out of the
      // payload — sending them bloats tokens and can truncate the JSON response.
      const content = section.content as Record<string, unknown>;
      const preserved: Record<string, unknown> = {};
      const toTranslate: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(content)) {
        if (PRESERVE_KEYS.has(key)) preserved[key] = value;
        else toTranslate[key] = value;
      }
      const contentStr = JSON.stringify(toTranslate);
      const messages = translateContentPrompt(
        contentStr,
        fromName,
        toName,
        locale,
      );

      try {
        const response = await callAI(provider, {
          apiKey,
          messages,
          model: fastModel,
          temperature: 0.3,
          // Bound each request so a stalled call can't hang the whole batch.
          signal: AbortSignal.timeout(60_000),
        });
        const parsed = parseJsonResponse<Record<string, unknown>>(response);
        onProgress?.(++completed, sections.length);
        return {
          id: section.id,
          title: translatedTitle,
          content: { ...parsed, ...preserved },
        };
      } catch {
        failedSections.push(section.title);
        onProgress?.(++completed, sections.length);
        return {
          id: section.id,
          title: translatedTitle,
          content: section.content as Record<string, unknown>,
        };
      }
    }),
  );

  return { sections: results, failedSections };
}
