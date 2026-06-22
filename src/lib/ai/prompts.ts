import type { ChatMessage } from "./types";
import type { Locale } from "@/lib/i18n/config";

type PromptLocale = Locale;

const PROMPT_TEXT = {
  fr: {
    improveSystem(content: { hasInstruction: boolean; instruction?: string }) {
      return `Tu es un expert en rédaction de CV professionnels. ${
        content.hasInstruction
          ? `Réécris le texte suivant en appliquant en priorité cette consigne de l'utilisateur : « ${content.instruction} ».`
          : "Améliore le texte suivant pour qu'il soit plus percutant, concis et orienté résultats. Utilise des verbes d'action et quantifie les réalisations quand c'est possible."
      }

Règles :
- Garde le format HTML avec les balises <p>, <ul>, <li>, <strong>, <em>
- Ne change pas les informations factuelles (dates, noms d'entreprises, etc.) sauf si la consigne le demande explicitement
- Reste dans la même langue que le texte d'origine
- Retourne UNIQUEMENT le HTML amélioré, sans explication`;
    },
    improveUser(content: string, context?: string) {
      return context
        ? `Contexte : ${context}\n\nTexte à améliorer :\n${content}`
        : `Texte à améliorer :\n${content}`;
    },
    summarySystem(lang: string) {
      return `Tu es un expert en rédaction de CV. Génère un résumé professionnel de 3-4 phrases en HTML (<p>). Le résumé doit être percutant, mettre en valeur les compétences clés et l'expérience du candidat. Écris en ${lang}.

Règles :
- Utilise uniquement des balises <p> (pas de listes ni de titres)
- Sois concis et impactant
- Retourne UNIQUEMENT le HTML, sans explication`;
    },
    summaryUser(data: {
      jobTitle: string;
      experiences: string;
      skills: string;
      education: string;
    }) {
      return `Titre du poste : ${data.jobTitle || "Non spécifié"}

Expériences :
${data.experiences || "Aucune expérience renseignée"}

Compétences :
${data.skills || "Aucune compétence renseignée"}

Formation :
${data.education || "Aucune formation renseignée"}`;
    },
    translateSystem(fromLang: string, toLang: string) {
      return `Tu es un traducteur professionnel spécialisé dans les CV. Traduis le contenu JSON suivant de ${fromLang} vers ${toLang}.

Règles :
- Conserve la structure JSON exacte (mêmes clés)
- Conserve tout le formatage HTML dans les valeurs
- Ne traduis PAS les noms propres (personnes, entreprises) sauf si une traduction courante existe
- Ne traduis PAS les URLs, emails, numéros de téléphone
- Retourne UNIQUEMENT le JSON traduit, sans explication ni backticks`;
    },
    atsSystem(data: { hasJobDescription: boolean; lang: string }) {
      return `Tu es un expert en recrutement et systèmes ATS. Analyse le CV suivant ${data.hasJobDescription ? "par rapport à la description du poste fournie " : ""}et retourne un score ATS ainsi que des recommandations concrètes. Réponds en ${data.lang}.

Retourne UNIQUEMENT ce JSON (pas de backticks, pas d'explication) :
{
  "score": <entier 0-100>,
  "strengths": [<string>, ...],
  "improvements": [<string>, ...],
  "keywords_missing": [<string>, ...]
}`;
    },
    atsUser(data: {
      jobTitle: string;
      sections: string;
      jobDescription?: string;
    }) {
      return `Poste ciblé : ${data.jobTitle || "Non spécifié"}\n\n${data.jobDescription ? `Description du poste ciblé :\n${data.jobDescription}\n\n` : ""}CV :\n${data.sections}`;
    },
    coverLetterSystem(lang: string) {
      return `Tu es un expert en rédaction de lettres de motivation professionnelles. Rédige une lettre de motivation personnalisée en ${lang}, au format HTML.

Structure attendue :
1. Formule de salutation (dans un <p>)
2. Introduction : pourquoi ce poste t'intéresse (dans un <p>)
3. 2-3 paragraphes : lien entre ton profil et le poste (chacun dans un <p>)
4. Conclusion avec appel à l'action (dans un <p>)
5. Formule de politesse (dans un <p>)

Règles :
- Ton professionnel mais engageant
- Fais le lien entre le profil du candidat et les exigences du poste
- Utilise uniquement des balises <p>, <strong>, <em>
- Retourne UNIQUEMENT le HTML, sans explication`;
    },
    coverLetterUser(data: {
      fullName: string;
      jobTitle: string;
      experiences: string;
      skills: string;
      targetJobTitle: string;
      targetCompany: string;
      jobDescription: string;
      recipientName?: string;
    }) {
      return `Candidat : ${data.fullName}
Poste actuel/visé : ${data.jobTitle}
Poste ciblé : ${data.targetJobTitle}
Entreprise : ${data.targetCompany}
${data.recipientName ? `Destinataire : ${data.recipientName}` : ""}

Expériences du candidat :
${data.experiences}

Compétences :
${data.skills}

Description du poste :
${data.jobDescription}`;
    },
  },
  en: {
    improveSystem(content: { hasInstruction: boolean; instruction?: string }) {
      return `You are an expert professional resume writer. ${
        content.hasInstruction
          ? `Rewrite the following text by prioritizing this user instruction: "${content.instruction}".`
          : "Improve the following text so it is more compelling, concise, and results-oriented. Use action verbs and quantify achievements when possible."
      }

Rules:
- Keep the HTML format with <p>, <ul>, <li>, <strong>, <em> tags
- Do not change factual information (dates, company names, etc.) unless the instruction explicitly asks for it
- Keep the same language as the original text
- Return ONLY the improved HTML, with no explanation`;
    },
    improveUser(content: string, context?: string) {
      return context
        ? `Context: ${context}\n\nText to improve:\n${content}`
        : `Text to improve:\n${content}`;
    },
    summarySystem(lang: string) {
      return `You are an expert resume writer. Generate a 3-4 sentence professional summary in HTML (<p>). The summary should be compelling and highlight the candidate's key skills and experience. Write in ${lang}.

Rules:
- Use only <p> tags (no lists or headings)
- Be concise and impactful
- Return ONLY the HTML, with no explanation`;
    },
    summaryUser(data: {
      jobTitle: string;
      experiences: string;
      skills: string;
      education: string;
    }) {
      return `Job title: ${data.jobTitle || "Not specified"}

Experience:
${data.experiences || "No experience provided"}

Skills:
${data.skills || "No skills provided"}

Education:
${data.education || "No education provided"}`;
    },
    translateSystem(fromLang: string, toLang: string) {
      return `You are a professional translator specializing in resumes. Translate the following JSON content from ${fromLang} to ${toLang}.

Rules:
- Preserve the exact JSON structure (same keys)
- Preserve all HTML formatting inside values
- Do NOT translate proper nouns (people, companies) unless a common translation exists
- Do NOT translate URLs, emails, or phone numbers
- Return ONLY the translated JSON, with no explanation and no backticks`;
    },
    atsSystem(data: { hasJobDescription: boolean; lang: string }) {
      return `You are an expert recruiter and ATS specialist. Analyze the following resume ${data.hasJobDescription ? "against the provided job description " : ""}and return an ATS score with concrete recommendations. Respond in ${data.lang}.

Return ONLY this JSON (no backticks, no explanation):
{
  "score": <integer 0-100>,
  "strengths": [<string>, ...],
  "improvements": [<string>, ...],
  "keywords_missing": [<string>, ...]
}`;
    },
    atsUser(data: {
      jobTitle: string;
      sections: string;
      jobDescription?: string;
    }) {
      return `Target role: ${data.jobTitle || "Not specified"}\n\n${data.jobDescription ? `Target job description:\n${data.jobDescription}\n\n` : ""}Resume:\n${data.sections}`;
    },
    coverLetterSystem(lang: string) {
      return `You are an expert professional cover letter writer. Write a personalized cover letter in ${lang}, in HTML format.

Expected structure:
1. Greeting (in a <p>)
2. Introduction: why this role is interesting (in a <p>)
3. 2-3 paragraphs: connect the candidate's profile to the role (each in a <p>)
4. Conclusion with a call to action (in a <p>)
5. Polite closing (in a <p>)

Rules:
- Professional but engaging tone
- Connect the candidate's profile to the job requirements
- Use only <p>, <strong>, <em> tags
- Return ONLY the HTML, with no explanation`;
    },
    coverLetterUser(data: {
      fullName: string;
      jobTitle: string;
      experiences: string;
      skills: string;
      targetJobTitle: string;
      targetCompany: string;
      jobDescription: string;
      recipientName?: string;
    }) {
      return `Candidate: ${data.fullName}
Current/target role: ${data.jobTitle}
Target role: ${data.targetJobTitle}
Company: ${data.targetCompany}
${data.recipientName ? `Recipient: ${data.recipientName}` : ""}

Candidate experience:
${data.experiences}

Skills:
${data.skills}

Job description:
${data.jobDescription}`;
    },
  },
} satisfies Record<PromptLocale, Record<string, unknown>>;

function promptText(locale: PromptLocale = "fr") {
  return PROMPT_TEXT[locale];
}

function languageName(language: string, locale: PromptLocale): string {
  if (locale === "en") {
    return language === "fr"
      ? "French"
      : language === "en"
        ? "English"
        : language;
  }
  return language === "fr"
    ? "français"
    : language === "en"
      ? "anglais"
      : language;
}

/**
 * Prompt to improve existing CV text content.
 */
export function improveContentPrompt(
  content: string,
  context?: string,
  instruction?: string,
  locale: PromptLocale = "fr",
): ChatMessage[] {
  const text = promptText(locale);
  const trimmedInstruction = instruction?.trim();
  return [
    {
      role: "system",
      content: text.improveSystem({
        hasInstruction: !!trimmedInstruction,
        instruction: trimmedInstruction,
      }),
    },
    {
      role: "user",
      content: text.improveUser(content, context),
    },
  ];
}

/**
 * Prompt to generate a professional summary from CV data.
 */
export function generateSummaryPrompt(
  resumeData: {
    jobTitle: string;
    experiences: string;
    skills: string;
    education: string;
    language: string;
  },
  locale: PromptLocale = "fr",
): ChatMessage[] {
  const text = promptText(locale);
  const lang = languageName(resumeData.language, locale);

  return [
    {
      role: "system",
      content: text.summarySystem(lang),
    },
    {
      role: "user",
      content: text.summaryUser(resumeData),
    },
  ];
}

/**
 * Prompt to translate CV content to a target language.
 * Sends a JSON structure and expects JSON back.
 */
export function translateContentPrompt(
  contentJson: string,
  fromLang: string,
  toLang: string,
  locale: PromptLocale = "fr",
): ChatMessage[] {
  const text = promptText(locale);
  return [
    {
      role: "system",
      content: text.translateSystem(fromLang, toLang),
    },
    {
      role: "user",
      content: contentJson,
    },
  ];
}

/**
 * Prompt to score a CV for ATS compatibility.
 * Returns JSON: { score, strengths, improvements, keywords_missing }
 */
export function atsScorePrompt(
  resumeData: {
    jobTitle: string;
    sections: string;
    language: string;
    jobDescription?: string;
  },
  locale: PromptLocale = "fr",
): ChatMessage[] {
  const text = promptText(locale);
  const lang = languageName(resumeData.language, locale);
  return [
    {
      role: "system",
      content: text.atsSystem({
        hasJobDescription: !!resumeData.jobDescription,
        lang,
      }),
    },
    {
      role: "user",
      content: text.atsUser(resumeData),
    },
  ];
}

/**
 * Prompt to generate a cover letter.
 */
export function generateCoverLetterPrompt(
  resumeData: {
    fullName: string;
    jobTitle: string;
    experiences: string;
    skills: string;
    language: string;
    targetJobTitle: string;
    targetCompany: string;
    jobDescription: string;
    recipientName?: string;
  },
  locale: PromptLocale = "fr",
): ChatMessage[] {
  const text = promptText(locale);
  const lang = languageName(resumeData.language, locale);

  return [
    {
      role: "system",
      content: text.coverLetterSystem(lang),
    },
    {
      role: "user",
      content: text.coverLetterUser(resumeData),
    },
  ];
}
