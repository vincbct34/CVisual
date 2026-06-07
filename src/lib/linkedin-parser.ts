/**
 * Parser déterministe pour les PDF LinkedIn exportés.
 * Supporte les profils en français et en anglais.
 * Aucune IA requise.
 */

// ── Types ───────────────────────────────────────────────────────

export interface ParsedProfile {
  fullName: string;
  jobTitle: string;
  summary: string;
  email: string;
  phone: string;
  location: string;
  website: string;
}

export interface ParsedExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface ParsedEducation {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ParsedSkill {
  id: string;
  name: string;
  level: number;
}

export interface ParsedLanguage {
  id: string;
  name: string;
  level: string;
}

export interface LinkedInParseResult {
  profile: ParsedProfile;
  experience: ParsedExperience[];
  education: ParsedEducation[];
  skills: ParsedSkill[];
  languages: ParsedLanguage[];
}

// ── Constantes ──────────────────────────────────────────────────

const MONTHS: Record<string, string> = {
  // Français
  janvier: "01",
  février: "02",
  mars: "03",
  avril: "04",
  mai: "05",
  juin: "06",
  juillet: "07",
  août: "08",
  septembre: "09",
  octobre: "10",
  novembre: "11",
  décembre: "12",
  // Anglais
  january: "01",
  february: "02",
  march: "03",
  april: "04",
  may: "05",
  june: "06",
  july: "07",
  august: "08",
  september: "09",
  october: "10",
  november: "11",
  december: "12",
  // Abrégés anglais
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

// Headings de section LinkedIn (FR + EN)
const HEADINGS = {
  contacts: ["Coordonnées", "Contact"],
  skills: ["Principales compétences", "Top Skills", "Compétences principales"],
  languages: ["Languages", "Langues"],
  summary: ["Résumé", "Summary", "About"],
  experience: ["Expérience", "Experience"],
  education: ["Formation", "Education", "Éducation"],
} as const;

// Niveaux de langue LinkedIn → CVisual
const LANGUAGE_LEVELS: Record<string, string> = {
  "native or bilingual": "Natif",
  "full professional": "Courant",
  "professional working": "Courant",
  "limited working": "Intermédiaire",
  elementary: "Débutant",
  // Français
  "langue maternelle ou bilingue": "Natif",
  "compétence professionnelle complète": "Courant",
  "compétence professionnelle": "Courant",
  "compétence professionnelle limitée": "Intermédiaire",
  notions: "Débutant",
};

// ── Utilitaires ─────────────────────────────────────────────────

/** Convertit "avril 2026" ou "April 2026" → "2026-04". Retourne "" si inconnu/présent. */
function parseDate(raw: string): string {
  const s = raw.trim().toLowerCase();
  if (
    !s ||
    s === "present" ||
    s === "présent" ||
    s === "aujourd'hui" ||
    s === "maintenant"
  )
    return "";
  if (/^\d{4}-\d{2}$/.test(s)) return s; // déjà formaté
  // Nom de mois = lettres non-ASCII incluses (février, août, décembre).
  const m = s.match(/^([^\d\s]+?)\.?\s+(\d{4})$/);
  if (m) {
    const month = MONTHS[m[1].replace(".", "")] ?? "01";
    return `${m[2]}-${month}`;
  }
  if (/^\d{4}$/.test(s)) return `${s}-01`;
  return "";
}

/**
 * Ligne de date LinkedIn : "avril 2026 - Present (3 mois)"
 * Retourne null si la ligne ne correspond pas.
 */
function parseDateRange(
  line: string,
): { start: string; end: string; current: boolean } | null {
  // On cherche le pattern "X - Y" ou "X – Y" (tiret long)
  const sep = line.includes(" – ")
    ? " – "
    : line.includes(" - ")
      ? " - "
      : null;
  if (!sep) return null;

  // Retirer la durée entre parenthèses
  const clean = line.replace(/\s*\(.*?\)\s*$/, "").trim();
  const parts = clean.split(sep);
  if (parts.length < 2) return null;

  const startRaw = parts[0].trim();
  const endRaw = parts[1].trim();

  // Le premier segment doit commencer par un mois ou une année
  const startsWithMonth = Object.keys(MONTHS).some((m) =>
    startRaw.toLowerCase().startsWith(m),
  );
  const startsWithYear = /^\d{4}/.test(startRaw);
  if (!startsWithMonth && !startsWithYear) return null;

  const isPresent = /^(present|présent|aujourd'hui|maintenant)$/i.test(endRaw);
  return {
    start: parseDate(startRaw),
    end: isPresent ? "" : parseDate(endRaw),
    current: isPresent,
  };
}

/**
 * Convertit un bloc de texte brut (tirets, catégories) en HTML simple.
 * - "Titre :"       → <p><strong>Titre :</strong></p>
 * - "- item"        → regroupés en <ul><li>…</li></ul>
 * - paragraphes     → <p>…</p>
 */
function textToHtml(lines: string[]): string {
  const out: string[] = [];
  let inList = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      continue;
    }

    if (line.startsWith("- ") || line.startsWith("• ")) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${line.slice(2).trim()}</li>`);
    } else if (/^.{3,60}\s*:$/.test(line)) {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      out.push(`<p><strong>${line}</strong></p>`);
    } else {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      out.push(`<p>${line}</p>`);
    }
  }
  if (inList) out.push("</ul>");
  return out.join("");
}

// ── Découpage en sections ───────────────────────────────────────

type SectionName = keyof typeof HEADINGS | "unknown";

interface Section {
  name: SectionName;
  lines: string[];
}

function splitIntoSections(lines: string[]): Section[] {
  const allHeadings = new Map<string, SectionName>();
  for (const [name, variants] of Object.entries(HEADINGS)) {
    for (const v of variants as readonly string[]) {
      allHeadings.set(v.toLowerCase(), name as SectionName);
    }
  }

  const sections: Section[] = [];
  let current: Section = { name: "unknown", lines: [] };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const sectionName = allHeadings.get(trimmed.toLowerCase());
    if (sectionName) {
      if (current.lines.length > 0 || current.name !== "unknown") {
        sections.push(current);
      }
      current = { name: sectionName, lines: [] };
    } else {
      current.lines.push(trimmed);
    }
  }
  if (current.lines.length > 0) sections.push(current);
  return sections;
}

// ── Parsers par section ─────────────────────────────────────────

function parseContacts(rawLines: string[]): Partial<ParsedProfile> {
  // Les longs emails sont parfois coupés sur deux lignes par le PDF
  // (".../gmail.c" + "om"). On rejoint la suite quand la ligne porte un "@"
  // sans TLD valide et que la suivante est une fin de domaine.
  const lines: string[] = [];
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    const next = (rawLines[i + 1] ?? "").trim();
    if (
      line.includes("@") &&
      !/\.[a-z]{2,}$/i.test(line) &&
      /^[a-z]{1,6}$/i.test(next)
    ) {
      lines.push(line + next);
      i++;
    } else {
      lines.push(line);
    }
  }

  let phone = "",
    email = "",
    website = "";
  const urlPattern = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}/i;
  const skipLabels = new Set(["(linkedin)", "(other)"]);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lower = line.toLowerCase();

    if (/^\d[\d\s().+-]{6,}/.test(line) && lower.includes("mobile")) {
      phone = lines[i - 1]?.trim() || line.replace(/\s*\(mobile\)/i, "").trim();
      continue;
    }
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(line)) {
      email = line;
      continue;
    }
    // URL avec label sur la ligne suivante
    if (urlPattern.test(line) && !line.includes("@")) {
      const nextLine = (lines[i + 1] ?? "").trim().toLowerCase();
      if (["(portfolio)", "(company)"].includes(nextLine) && !website) {
        website = line.startsWith("http") ? line : `https://${line}`;
      }
      if (
        !skipLabels.has(nextLine) &&
        !website &&
        !line.includes("linkedin.com")
      ) {
        website = line.startsWith("http") ? line : `https://${line}`;
      }
    }
    if (line.startsWith("(") && line.endsWith(")")) continue; // label, skip
  }

  return { phone, email, website };
}

function parseSkills(lines: string[]): ParsedSkill[] {
  return lines
    .filter((l) => l.trim() && !l.trim().startsWith("("))
    .map((name, i) => ({ id: String(i + 1), name: name.trim(), level: 3 }));
}

function parseLanguages(lines: string[]): ParsedLanguage[] {
  const results: ParsedLanguage[] = [];
  // Format: "Espagnol (Elementary)" ou "Espagnol" sur une ligne, niveau sur la suivante
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const m = line.match(/^(.+?)\s*\((.+?)\)$/);
    if (m) {
      const rawLevel = m[2].toLowerCase();
      const level = LANGUAGE_LEVELS[rawLevel] ?? "Intermédiaire";
      results.push({
        id: String(results.length + 1),
        name: m[1].trim(),
        level,
      });
    } else {
      // Niveau sur la prochaine ligne ?
      const nextLine = (lines[i + 1] ?? "").trim().toLowerCase();
      const level = LANGUAGE_LEVELS[nextLine];
      if (level) {
        results.push({ id: String(results.length + 1), name: line, level });
        i++;
      } else {
        results.push({
          id: String(results.length + 1),
          name: line,
          level: "Intermédiaire",
        });
      }
    }
  }
  return results;
}

function parseMainContent(lines: string[]): {
  fullName: string;
  jobTitle: string;
  location: string;
} {
  let fullName = "";
  const jobTitleParts: string[] = [];
  let location = "";

  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // 1. Première ligne non-vide = nom complet
    if (!fullName) {
      fullName = line;
      continue;
    }

    // 2. URL LinkedIn/portfolio inline après le titre — on ignore (ou on intègre au titre)
    const isUrl =
      /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(line) &&
      !line.includes(" ");

    // 3. Localisation : virgule + mot, courte, pas une URL
    if (
      !location &&
      !isUrl &&
      /,\s*\w/.test(line) &&
      line.split(/\s+/).length <= 6
    ) {
      location = line;
      continue;
    }

    // 4. Lignes URL rattachées au titre (ex: "404factory.vincent-bichat.fr"
    //    ou "Montpellier Portfolio: github.com/…") — redondantes avec website
    if (isUrl) continue;
    if (
      /\b(www\.|https?:|portfolio\s*:)/i.test(line) ||
      /\.[a-z]{2,}\//i.test(line)
    )
      continue;

    // 5. Reste = titre du poste (peut être sur 2 lignes)
    jobTitleParts.push(line);
  }

  // Nettoyer le titre : enlever une virgule finale éventuelle
  const rawTitle = jobTitleParts.join(" ").replace(/\s+/g, " ").trim();
  const jobTitle = rawTitle.endsWith(",")
    ? rawTitle.slice(0, -1).trim()
    : rawTitle;

  return { fullName, jobTitle, location };
}

/** Une ligne de localisation : courte, sans puce, sans date, peu de mots. */
function isLocationLine(line: string): boolean {
  if (!line) return false;
  if (line.length > 50) return false;
  if (line.startsWith("-") || line.startsWith("•")) return false;
  if (line.endsWith(":")) return false;
  if (parseDateRange(line)) return false;
  return line.split(/\s+/).length <= 6;
}

/** Nom propre : 1–4 mots capitalisés, sans ponctuation de titre/URL ni chiffre. */
function looksLikeName(line: string): boolean {
  const s = line.trim();
  if (!s || s.length > 40) return false;
  if (/[|/:•@()]/.test(s)) return false; // ponctuation de titre/contact
  if (/\s[-–]\s/.test(s)) return false; // séparateur de titre
  if (/\d/.test(s)) return false;
  if (/\bwww\.|https?:/i.test(s) || /\.[a-z]{2,}(\/|$)/i.test(s)) return false; // URL
  const words = s.split(/\s+/);
  if (words.length < 1 || words.length > 4) return false;
  const particles = new Set([
    "de",
    "du",
    "da",
    "van",
    "von",
    "le",
    "la",
    "den",
    "der",
    "dos",
    "das",
  ]);
  return words.every(
    (w) => particles.has(w.toLowerCase()) || /^[A-ZÀ-Ý]/.test(w),
  );
}

/**
 * Sépare le bloc profil (nom, titre, localisation) accolé à la fin d'une section
 * sidebar, juste avant le contenu principal.
 *
 * pdf-parse extrait la sidebar (Coordonnées → Compétences → Languages) avant le
 * contenu principal (nom, titre, ville, Résumé…). Le bloc profil se retrouve donc
 * collé à la fin de la dernière section sidebar — peu importe laquelle (skills si
 * pas de Languages, sinon languages). On l'isole génériquement :
 *   - ancre basse  = dernière ligne de localisation ("Ville, Région, Pays") ;
 *   - ancre haute  = première ligne ressemblant à un nom, en remontant.
 */
function splitProfileTail(region: string[]): {
  block: string[];
  content: string[];
} {
  let anchor = -1;
  for (let i = region.length - 1; i >= 0; i--) {
    if (isLocationLine(region[i]) && region[i].includes(",")) {
      anchor = i;
      break;
    }
  }
  if (anchor === -1) return { block: [], content: region };

  let start = anchor;
  for (let i = anchor - 1; i >= 0; i--) {
    start = i;
    if (looksLikeName(region[i])) break;
  }

  return {
    block: region.slice(start, anchor + 1),
    content: [...region.slice(0, start), ...region.slice(anchor + 1)],
  };
}

/**
 * Parse les entrées d'expérience à partir de la ligne de date comme ancre.
 *
 * Structure LinkedIn (vérifiée sur exports FR/EN) :
 *   <compagnie>
 *   <poste>
 *   <plage de dates>      ← ancre fiable (parseDateRange)
 *   <localisation?>
 *   <description…>        ← jusqu'à 2 lignes avant la date de l'entrée suivante
 *
 * L'ancrage sur la date évite les deux écueils de l'ancien algorithme :
 * dépendance à un séparateur d'espace précis, et fuite de la description
 * d'une entrée dans l'en-tête de la suivante.
 */
function parseExperiences(lines: string[]): ParsedExperience[] {
  const clean = lines.map((l) => l.trim()).filter(Boolean);

  // Indices de toutes les lignes de plage de dates.
  const dateIdx: number[] = [];
  for (let i = 0; i < clean.length; i++) {
    if (parseDateRange(clean[i])) dateIdx.push(i);
  }

  const results: ParsedExperience[] = [];
  for (let k = 0; k < dateIdx.length; k++) {
    const d = dateIdx[k];
    const dr = parseDateRange(clean[d])!;

    const company = (clean[d - 2] ?? "").trim();
    const position = (clean[d - 1] ?? "").trim();

    // La description s'arrête 2 lignes avant la date suivante (= compagnie +
    // poste de l'entrée suivante), ou à la fin pour la dernière entrée.
    const regionEnd =
      k + 1 < dateIdx.length ? dateIdx[k + 1] - 2 : clean.length;

    let descStart = d + 1;
    if (descStart < regionEnd && isLocationLine(clean[descStart])) descStart++;

    const descLines = clean.slice(descStart, Math.max(descStart, regionEnd));

    results.push({
      id: String(results.length + 1),
      company,
      position,
      startDate: dr.start,
      endDate: dr.end,
      current: dr.current,
      description: textToHtml(descLines),
    });
  }

  return results.filter((e) => e.company || e.position);
}

function parseEducation(lines: string[]): ParsedEducation[] {
  const results: ParsedEducation[] = [];
  // Pattern : institution sur une ligne, "Degree · (date)" sur la suivante
  // ou "Degree\n(dates)" séparé

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }

    // Ligne suivante
    const next = (lines[i + 1] ?? "").trim();

    // Détecter le séparateur "·" ou "•"
    const degreeMatch = next.match(/^(.*?)\s*[·•]\s*(.+)$/);
    if (degreeMatch) {
      const institution = line;
      let degree = degreeMatch[1].trim();
      let field = "";
      let startDate = "";
      let endDate = "";

      // Les dates sont dans la partie après "·"
      const datePart = degreeMatch[2].trim().replace(/[()]/g, "");
      const dateRange = parseDateRange(datePart.replace(/\s+/, " "));
      if (dateRange) {
        startDate = dateRange.start;
        endDate = dateRange.end;
      } else {
        // "octobre 2023 - août 2026" sans tiret en fin
        const parts = datePart.split(/\s*-\s*/);
        if (parts.length === 2) {
          startDate = parseDate(parts[0]);
          endDate = parseDate(parts[1]);
        }
      }

      // Séparer degree et field si format "Degree, Field"
      const commaIdx = degree.indexOf(",");
      if (commaIdx > 0) {
        field = degree.slice(commaIdx + 1).trim();
        degree = degree.slice(0, commaIdx).trim();
      }

      results.push({
        id: String(results.length + 1),
        institution,
        degree,
        field,
        startDate,
        endDate,
        description: "",
      });
      i += 2;
    } else {
      // Essayer de récupérer quand même l'établissement
      const dr = parseDateRange(next);
      if (dr) {
        results.push({
          id: String(results.length + 1),
          institution: line,
          degree: "",
          field: "",
          startDate: dr.start,
          endDate: dr.end,
          description: "",
        });
        i += 2;
      } else {
        i++;
      }
    }
  }
  return results;
}

// ── Entrée principale ───────────────────────────────────────────

/**
 * Parse le texte extrait d'un PDF LinkedIn.
 * @param rawText  Texte brut retourné par pdf-parse
 */
export function parseLinkedInText(rawText: string): LinkedInParseResult {
  const lines = rawText
    // LinkedIn PDFs use NBSP (U+00A0) and narrow/figure spaces around dashes
    // and durations — normalize them so date/space matching works.
    .replace(/[\u00A0\u202F\u2007\u2009\u2060\uFEFF]/g, " ")
    .split("\n")
    .map((l) => l.trim())
    // Drop pagination artifacts ("Page 1 of 5" / "Page 1 sur 5").
    .filter((l) => l && !/^page\s+\d+\s+(of|sur)\s+\d+$/i.test(l));

  const sections = splitIntoSections(lines);

  // ── Isoler le bloc profil avant de répartir les sections ────────────────
  //
  // Le bloc nom/titre/ville est collé à la fin de la dernière section sidebar,
  // juste avant la première section de contenu principal (Résumé / Expérience /
  // Formation). On le retire de cette section pour qu'il ne pollue ni les
  // compétences ni les langues.
  const MAIN_SECTIONS = new Set<SectionName>([
    "summary",
    "experience",
    "education",
  ]);
  let profileBlock: string[] = [];
  const firstMainIdx = sections.findIndex((s) => MAIN_SECTIONS.has(s.name));
  if (firstMainIdx > 0) {
    const prev = sections[firstMainIdx - 1];
    const split = splitProfileTail(prev.lines);
    profileBlock = split.block;
    prev.lines = split.content;
  }

  // Collecter les sections
  const contactLines: string[] = [];
  const skillLines: string[] = [];
  const languageLines: string[] = [];
  const summaryLines: string[] = [];
  const experienceLines: string[] = [];
  const educationLines: string[] = [];
  const unknownLines: string[] = [];

  for (const s of sections) {
    switch (s.name) {
      case "contacts":
        contactLines.push(...s.lines);
        break;
      case "skills":
        skillLines.push(...s.lines);
        break;
      case "languages":
        languageLines.push(...s.lines);
        break;
      case "summary":
        summaryLines.push(...s.lines);
        break;
      case "experience":
        experienceLines.push(...s.lines);
        break;
      case "education":
        educationLines.push(...s.lines);
        break;
      default:
        unknownLines.push(...s.lines);
        break;
    }
  }

  // Source du bloc profil : la queue isolée de la section sidebar (cas normal),
  // ou unknownLines si le PDF commence directement par le contenu principal.
  const profileHeaderLines =
    profileBlock.length > 0 ? profileBlock : unknownLines;

  const mainInfo = parseMainContent(profileHeaderLines);
  const contacts = parseContacts(contactLines);

  const summary =
    summaryLines.length > 0 ? `<p>${summaryLines.join(" ")}</p>` : "";

  return {
    profile: {
      fullName: mainInfo.fullName,
      jobTitle: mainInfo.jobTitle,
      summary,
      email: contacts.email ?? "",
      phone: contacts.phone ?? "",
      location: mainInfo.location,
      website: contacts.website ?? "",
    },
    experience: parseExperiences(experienceLines),
    education: parseEducation(educationLines),
    skills: parseSkills(skillLines),
    languages: parseLanguages(languageLines),
  };
}
