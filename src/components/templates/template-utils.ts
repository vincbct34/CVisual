import DOMPurify from "isomorphic-dompurify";
import { TIPTAP_ALLOWED_TAGS, TIPTAP_ALLOWED_ATTR } from "@/lib/sanitize";
import type { CSSProperties } from "react";
import type {
  Section,
  ProfileContent,
  ExperienceItem,
  EducationItem,
  SkillItem,
  LanguageItem,
  ProjectItem,
  CertificationItem,
  InterestItem,
  ResumeStyle,
} from "@/types/resume";

/**
 * Pick a legible text color (near-black or white) for a given background,
 * based on its perceived luminance. Guards against white-on-white / dark-on-dark
 * when the background is driven by user-chosen colors (or a white sidebar slot).
 */
function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const h = (hex || "").trim().replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  if (full.length !== 6 || /[^0-9a-fA-F]/.test(full)) return null;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function luminance(hex: string): number | null {
  const c = parseHex(hex);
  if (!c) return null;
  return (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
}

/** Same hue at a given opacity — for "empty"/track parts of level indicators. */
export function withAlpha(hex: string, alpha: number): string {
  const c = parseHex(hex);
  if (!c) return hex;
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
}

export function readableTextColor(bg: string): string {
  const lum = luminance(bg);
  if (lum === null) return "#ffffff";
  return lum > 0.6 ? "#1a1a1a" : "#ffffff";
}

/**
 * Accent color safe to use as TEXT on a white/light background. Keeps the
 * chosen hue unless it's so light it would be near-invisible, in which case
 * it falls back to a dark ink.
 */
export function accentTextOnLight(accent: string): string {
  const lum = luminance(accent);
  if (lum === null) return accent;
  return lum > 0.8 ? "#1a1a1a" : accent;
}

/**
 * Build the list of contact lines shown in template headers/sidebars:
 * the fixed fields (email, phone, location, website) followed by any
 * user-defined custom fields, formatted as "Label : value" when labelled.
 */
export function getContactLines(profile: ProfileContent): string[] {
  const base = [
    profile.email,
    profile.phone,
    profile.location,
    profile.website,
  ].filter(Boolean) as string[];
  const custom = (profile.customFields ?? [])
    .filter((f) => f.value?.trim())
    .map((f) =>
      f.label?.trim()
        ? `${f.label.trim()} : ${f.value.trim()}`
        : f.value.trim(),
    );
  return [...base, ...custom];
}

/**
 * Default section types placed in the sidebar, per template.
 * Used when the user hasn't explicitly chosen a layout.
 */
export function defaultSidebarTypes(template: string): Set<string> {
  if (template === "creative")
    return new Set(["skills", "languages", "interests"]);
  if (template === "modern") return new Set(["skills", "languages"]);
  return new Set();
}

/**
 * Whether a section belongs in the sidebar.
 * Explicit user choice (by section id) wins; otherwise falls back to the
 * template's default section types.
 */
export function isSidebarSection(
  section: Section,
  style: ResumeStyle,
  defaultTypes: Set<string>,
): boolean {
  if (style.sidebarSections) return style.sidebarSections.includes(section.id);
  return defaultTypes.has(section.type);
}

/**
 * Build inline overrides for the profile photo from user style.
 * Only emits a property when the user has set it — otherwise each template
 * keeps its own default size/shape (from its Tailwind classes).
 */
export function getPhotoStyle(style: ResumeStyle): CSSProperties {
  const s: CSSProperties = {};
  if (style.photoSize) {
    s.width = `${style.photoSize}px`;
    s.height = `${style.photoSize}px`;
  }
  if (style.photoShape) {
    s.borderRadius =
      style.photoShape === "circle"
        ? "9999px"
        : style.photoShape === "square"
          ? "0px"
          : "12px";
  }
  return s;
}

/**
 * Root container font style for a template. Sets the body text size (px) plus
 * two CSS-variable multipliers that the size tokens in `FS` read:
 *   --cv-head → names + section titles (Titres slider)
 *   --cv-meta → dates + contact/meta lines (Dates slider)
 * Everything below is expressed in `em`, so it cascades from this px base and
 * tracks the body-size (Texte) slider; the vars then scale headings/meta on top.
 */
export function getRootFontStyle(style: ResumeStyle): CSSProperties {
  return {
    fontFamily: style.fontFamily,
    fontSize: `${style.fontSize}px`,
    ["--cv-head" as string]: String(style.headingScale ?? 1),
    ["--cv-meta" as string]: String(style.metaScale ?? 1),
  } as CSSProperties;
}

/**
 * Semantic font-size tokens. `em` values reproduce each template's original
 * Tailwind sizes at the default 14px body, then scale with the slider vars.
 * Applied as inline `fontSize` (overrides the legacy `text-*` classes).
 */
export const FS = {
  name: "calc(2.15em * var(--cv-head, 1))", // text-3xl
  nameLg: "calc(2.55em * var(--cv-head, 1))", // text-4xl
  subtitle: "calc(1.3em * var(--cv-head, 1))", // text-lg
  subtitleSm: "calc(1.15em * var(--cv-head, 1))", // text-base
  heading: "calc(1.15em * var(--cv-head, 1))", // text-base section title
  headingSm: "calc(1em * var(--cv-head, 1))", // text-sm section title
  headingXs: "calc(0.86em * var(--cv-head, 1))", // text-xs sidebar/label title
  body: "1em",
  bodySm: "0.92em",
  meta: "calc(0.86em * var(--cv-meta, 1))", // dates, contacts, technologies
} as const;

export function sanitize(html: string): string {
  if (!html) return "";
  // isomorphic-dompurify runs native DOMPurify in the browser and DOMPurify
  // over jsdom on the server, so server-rendered output (/render, /share, PDF
  // export) gets the SAME real sanitizer as the client — not a bypassable
  // regex. /share is public HTML served to other people, so this is the
  // primary defense against stored XSS in CV content.
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: TIPTAP_ALLOWED_TAGS,
    ALLOWED_ATTR: TIPTAP_ALLOWED_ATTR,
  });
}

export function getProfile(sections: Section[]): ProfileContent {
  const s = sections.find((s) => s.type === "profile");
  return (
    (s?.content as unknown as ProfileContent) ?? {
      fullName: "",
      jobTitle: "",
      summary: "",
      email: "",
      phone: "",
      location: "",
      website: "",
    }
  );
}

export function getItems<T>(sections: Section[], type: string): T[] {
  const s = sections.find((s) => s.type === type);
  const content = s?.content as Record<string, unknown> | undefined;
  return (content?.items as T[]) ?? [];
}

export function getExperiences(sections: Section[]): ExperienceItem[] {
  return getItems<ExperienceItem>(sections, "experience");
}

export function getEducation(sections: Section[]): EducationItem[] {
  return getItems<EducationItem>(sections, "education");
}

export function getSkills(sections: Section[]): SkillItem[] {
  return getItems<SkillItem>(sections, "skills");
}

export function getLanguages(sections: Section[]): LanguageItem[] {
  return getItems<LanguageItem>(sections, "languages");
}

export function getProjects(sections: Section[]): ProjectItem[] {
  return getItems<ProjectItem>(sections, "projects");
}

export function getCertifications(sections: Section[]): CertificationItem[] {
  return getItems<CertificationItem>(sections, "certifications");
}

export function getInterests(sections: Section[]): InterestItem[] {
  return getItems<InterestItem>(sections, "interests");
}

export function getVisibleSections(sections: Section[]): Section[] {
  return sections.filter((s) => s.visible).sort((a, b) => a.order - b.order);
}

export function getSectionTitle(sections: Section[], type: string): string {
  return sections.find((s) => s.type === type)?.title ?? "";
}

export function formatDate(date: string): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
}

/**
 * Check if a string contains HTML tags (from Tiptap rich text).
 * Falls back to plain text rendering if no HTML detected.
 */
export function isHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}
