import type { ChatMessage } from "./types";

/**
 * Prompt to improve existing CV text content.
 */
export function improveContentPrompt(
  content: string,
  context?: string,
  instruction?: string,
): ChatMessage[] {
  const trimmedInstruction = instruction?.trim();
  return [
    {
      role: "system",
      content: `Tu es un expert en rédaction de CV professionnels. ${
        trimmedInstruction
          ? `Réécris le texte suivant en appliquant en priorité cette consigne de l'utilisateur : « ${trimmedInstruction} ».`
          : "Améliore le texte suivant pour qu'il soit plus percutant, concis et orienté résultats. Utilise des verbes d'action et quantifie les réalisations quand c'est possible."
      }

Règles :
- Garde le format HTML avec les balises <p>, <ul>, <li>, <strong>, <em>
- Ne change pas les informations factuelles (dates, noms d'entreprises, etc.) sauf si la consigne le demande explicitement
- Reste dans la même langue que le texte d'origine
- Retourne UNIQUEMENT le HTML amélioré, sans explication`,
    },
    {
      role: "user",
      content: context
        ? `Contexte : ${context}\n\nTexte à améliorer :\n${content}`
        : `Texte à améliorer :\n${content}`,
    },
  ];
}

/**
 * Prompt to generate a professional summary from CV data.
 */
export function generateSummaryPrompt(resumeData: {
  jobTitle: string;
  experiences: string;
  skills: string;
  education: string;
  language: string;
}): ChatMessage[] {
  const lang = resumeData.language === "fr" ? "français" : resumeData.language;

  return [
    {
      role: "system",
      content: `Tu es un expert en rédaction de CV. Génère un résumé professionnel de 3-4 phrases en HTML (<p>). Le résumé doit être percutant, mettre en valeur les compétences clés et l'expérience du candidat. Écris en ${lang}.

Règles :
- Utilise uniquement des balises <p> (pas de listes ni de titres)
- Sois concis et impactant
- Retourne UNIQUEMENT le HTML, sans explication`,
    },
    {
      role: "user",
      content: `Titre du poste : ${resumeData.jobTitle || "Non spécifié"}

Expériences :
${resumeData.experiences || "Aucune expérience renseignée"}

Compétences :
${resumeData.skills || "Aucune compétence renseignée"}

Formation :
${resumeData.education || "Aucune formation renseignée"}`,
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
): ChatMessage[] {
  return [
    {
      role: "system",
      content: `Tu es un traducteur professionnel spécialisé dans les CV. Traduis le contenu JSON suivant de ${fromLang} vers ${toLang}.

Règles :
- Conserve la structure JSON exacte (mêmes clés)
- Conserve tout le formatage HTML dans les valeurs
- Ne traduis PAS les noms propres (personnes, entreprises) sauf si une traduction courante existe
- Ne traduis PAS les URLs, emails, numéros de téléphone
- Retourne UNIQUEMENT le JSON traduit, sans explication ni backticks`,
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
export function atsScorePrompt(resumeData: {
  jobTitle: string;
  sections: string;
  language: string;
  jobDescription?: string;
}): ChatMessage[] {
  const lang = resumeData.language === "fr" ? "français" : resumeData.language;
  return [
    {
      role: "system",
      content: `Tu es un expert en recrutement et systèmes ATS. Analyse le CV suivant ${resumeData.jobDescription ? "par rapport à la description du poste fournie " : ""}et retourne un score ATS ainsi que des recommandations concrètes. Réponds en ${lang}.

Retourne UNIQUEMENT ce JSON (pas de backticks, pas d'explication) :
{
  "score": <entier 0-100>,
  "strengths": [<string>, ...],
  "improvements": [<string>, ...],
  "keywords_missing": [<string>, ...]
}`,
    },
    {
      role: "user",
      content: `Poste ciblé : ${resumeData.jobTitle || "Non spécifié"}\n\n${resumeData.jobDescription ? `Description du poste ciblé :\n${resumeData.jobDescription}\n\n` : ""}CV :\n${resumeData.sections}`,
    },
  ];
}

/**
 * Prompt to parse pasted LinkedIn profile text into structured CV sections.
 * Returns JSON matching the resume section format.
 */
export function linkedinImportPrompt(text: string): ChatMessage[] {
  return [
    {
      role: "system",
      content: `Tu es un expert en CV. À partir du texte d'un profil LinkedIn (extrait d'un PDF ou copié), extrait les informations et retourne UNIQUEMENT ce JSON valide (sans backticks, sans commentaire, sans explication) :

{
  "profile": {
    "fullName": "",
    "jobTitle": "",
    "summary": "",
    "email": "",
    "phone": "",
    "location": "",
    "website": ""
  },
  "experience": [{
    "id": "1",
    "company": "",
    "position": "",
    "startDate": "",
    "endDate": "",
    "current": false,
    "description": ""
  }],
  "education": [{
    "id": "1",
    "institution": "",
    "degree": "",
    "field": "",
    "startDate": "",
    "endDate": "",
    "description": ""
  }],
  "skills": [{ "id": "1", "name": "", "level": 3 }],
  "languages": [{ "id": "1", "name": "", "level": "Courant" }]
}

Règles strictes :
- IDs : chaînes incrémentales ("1", "2", "3"…)
- Dates : format "YYYY-MM" (ex: "2024-07"). Si seul l'année est connue, utilise "YYYY-01". Jamais de texte libre dans les dates.
- current : true si le poste est encore en cours (endDate vide ou "Present")
- description : convertis les listes à tirets en HTML <ul><li>…</li></ul>. Un paragraphe devient <p>…</p>. Ne laisse jamais de tirets en début de ligne.
- Niveaux de compétence : entier 1 (débutant) à 5 (expert) — estime d'après le contexte
- Niveaux de langue : "Natif" | "Courant" | "Intermédiaire" | "Débutant"
  Mapping LinkedIn → CVisual : "Native or Bilingual" → "Natif", "Full Professional" | "Professional Working" → "Courant", "Limited Working" → "Intermédiaire", "Elementary" → "Débutant"
- website : privilégie le portfolio personnel plutôt que LinkedIn
- Si une section est absente du profil, retourne un tableau vide []
- Champs inconnus : chaîne vide ""`,
    },
    { role: "user", content: text },
  ];
}

/**
 * Prompt to generate a cover letter.
 */
export function generateCoverLetterPrompt(resumeData: {
  fullName: string;
  jobTitle: string;
  experiences: string;
  skills: string;
  language: string;
  targetJobTitle: string;
  targetCompany: string;
  jobDescription: string;
  recipientName?: string;
}): ChatMessage[] {
  const lang = resumeData.language === "fr" ? "français" : resumeData.language;

  return [
    {
      role: "system",
      content: `Tu es un expert en rédaction de lettres de motivation professionnelles. Rédige une lettre de motivation personnalisée en ${lang}, au format HTML.

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
- Retourne UNIQUEMENT le HTML, sans explication`,
    },
    {
      role: "user",
      content: `Candidat : ${resumeData.fullName}
Poste actuel/visé : ${resumeData.jobTitle}
Poste ciblé : ${resumeData.targetJobTitle}
Entreprise : ${resumeData.targetCompany}
${resumeData.recipientName ? `Destinataire : ${resumeData.recipientName}` : ""}

Expériences du candidat :
${resumeData.experiences}

Compétences :
${resumeData.skills}

Description du poste :
${resumeData.jobDescription}`,
    },
  ];
}
