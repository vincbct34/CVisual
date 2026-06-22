import { isLocale, defaultLocale, type Locale } from "./config";

// Server-side message catalog for API responses. Kept separate from the client
// UI dictionaries so route handlers don't pull the whole UI string set, and so
// the locale can be resolved per-request (cookie → Accept-Language → default).

const MESSAGES = {
  fr: {
    // generic / guards
    notAuthenticated: "Non authentifié",
    cvNotFound: "CV non trouvé",
    letterNotFound: "Lettre non trouvée",
    invalidData: "Données invalides",
    invalidJson: "JSON invalide",
    rateLimited: "Trop de tentatives. Réessayez plus tard.",
    serverError: "Erreur interne du serveur",
    requestInvalid: "Requête invalide",
    formatUnsupported: "Format non supporté",
    // auth
    userNotFound: "Utilisateur non trouvé",
    passwordChanged: "Mot de passe modifié",
    loggedOut: "Déconnecté",
    emailTaken: "Cet email est déjà utilisé",
    accountDeleted: "Compte supprimé",
    refreshRevoked: "Refresh token révoqué",
    refreshInvalid: "Refresh token invalide",
    emailExists: "Un compte avec cet email existe déjà",
    tokenInvalidExpired: "Token invalide ou expiré",
    sessionRevoked: "Session révoquée",
    sessionIdRequired: "ID de session requis",
    emailInvalid: "Email invalide",
    apiKeyMissing: "Clé API manquante",
    // cv / sections / export
    cvDeleted: "CV supprimé",
    sectionNotFound: "Section non trouvée",
    sectionDeleted: "Section supprimée",
    letterDeleted: "Lettre supprimée",
    duplicateError: "Erreur lors de la duplication",
    pdfError: "Erreur lors de la génération du PDF",
    docxError: "Erreur lors de la génération du DOCX",
    htmlError: "Erreur lors de la génération du HTML",
    exportFailed: "Erreur lors de la génération du {format}",
    structureInvalid: "Structure invalide : {messages}",
    isPublicBool: "Le paramètre isPublic doit être un booléen",
    // linkedin
    fileMustBePdf: "Le fichier doit être un PDF",
    fileTooLarge10: "Le fichier ne doit pas dépasser 10 Mo",
    pdfNotEnoughText:
      "Le PDF ne contient pas assez de texte lisible. Utilisez le PDF exporté depuis LinkedIn (profil → « Enregistrer en PDF »).",
    pdfNoName:
      "Impossible d'extraire le nom du profil. Vérifiez que le fichier est bien un export LinkedIn.",
    pdfCantRead:
      "Impossible de lire ce PDF. Vérifiez qu'il n'est pas protégé par un mot de passe.",
    // creation defaults (become document content)
    defaultProfile: "Profil",
    defaultExperience: "Expériences professionnelles",
    defaultEducation: "Formation",
    defaultSkills: "Compétences",
    defaultLanguages: "Langues",
    defaultLetterTitle: "Ma lettre de motivation",
  },
  en: {
    notAuthenticated: "Not authenticated",
    cvNotFound: "Resume not found",
    letterNotFound: "Letter not found",
    invalidData: "Invalid data",
    invalidJson: "Invalid JSON",
    rateLimited: "Too many attempts. Try again later.",
    serverError: "Internal server error",
    requestInvalid: "Invalid request",
    formatUnsupported: "Unsupported format",
    userNotFound: "User not found",
    passwordChanged: "Password changed",
    loggedOut: "Logged out",
    emailTaken: "This email is already in use",
    accountDeleted: "Account deleted",
    refreshRevoked: "Refresh token revoked",
    refreshInvalid: "Invalid refresh token",
    emailExists: "An account with this email already exists",
    tokenInvalidExpired: "Invalid or expired token",
    sessionRevoked: "Session revoked",
    sessionIdRequired: "Session ID required",
    emailInvalid: "Invalid email",
    apiKeyMissing: "Missing API key",
    cvDeleted: "Resume deleted",
    sectionNotFound: "Section not found",
    sectionDeleted: "Section deleted",
    letterDeleted: "Letter deleted",
    duplicateError: "Error while duplicating",
    pdfError: "Error while generating the PDF",
    docxError: "Error while generating the DOCX",
    htmlError: "Error while generating the HTML",
    exportFailed: "Error while generating the {format}",
    structureInvalid: "Invalid structure: {messages}",
    isPublicBool: "The isPublic parameter must be a boolean",
    fileMustBePdf: "The file must be a PDF",
    fileTooLarge10: "The file must not exceed 10 MB",
    pdfNotEnoughText:
      "The PDF doesn't contain enough readable text. Use the PDF exported from LinkedIn (profile → “Save to PDF”).",
    pdfNoName:
      "Couldn't extract the profile name. Check that the file is a LinkedIn export.",
    pdfCantRead:
      "Couldn't read this PDF. Check that it isn't password-protected.",
    defaultProfile: "Profile",
    defaultExperience: "Work experience",
    defaultEducation: "Education",
    defaultSkills: "Skills",
    defaultLanguages: "Languages",
    defaultLetterTitle: "My cover letter",
  },
} as const;

export type ApiMessageKey = keyof (typeof MESSAGES)["fr"];

/** Resolve the request locale from the `locale` cookie, then Accept-Language. */
export function getRequestLocale(request: { headers: Headers }): Locale {
  const cookie = request.headers.get("cookie") ?? "";
  const match = /(?:^|;\s*)locale=([^;]+)/.exec(cookie);
  if (match && isLocale(match[1])) return match[1];

  const accept = request.headers.get("accept-language");
  if (accept) {
    for (const part of accept.split(",")) {
      const base = part.split(";")[0].trim().toLowerCase().split("-")[0];
      if (isLocale(base)) return base;
    }
  }
  return defaultLocale;
}

/** Translate a single API message for the request's locale. */
export function apiMessage(
  request: { headers: Headers },
  key: ApiMessageKey,
): string {
  return MESSAGES[getRequestLocale(request)][key];
}

/** Bind a translator to a request — `const m = apiT(request); m("cvNotFound")`. */
export function apiT(request: {
  headers: Headers;
}): (key: ApiMessageKey) => string {
  const locale = getRequestLocale(request);
  return (key) => MESSAGES[locale][key];
}
