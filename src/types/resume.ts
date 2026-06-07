export type PhotoShape = "circle" | "rounded" | "square";

export interface ResumeStyle {
  primaryColor: string;
  fontFamily: string;
  fontSize: number; // body text base, px
  headingScale?: number; // multiplier for names + section titles (default 1)
  metaScale?: number; // multiplier for dates + contact/meta text (default 1)
  photoShape?: PhotoShape;
  photoSize?: number; // px, applied across templates when set
  sidebarSections?: string[]; // section ids placed in sidebar (modern/creative)
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
}

export interface ProfileContent {
  fullName: string;
  jobTitle: string;
  summary: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  photoBase64?: string;
  customFields?: CustomField[];
}

export interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface SkillItem {
  id: string;
  name: string;
  level: number; // 1-5
}

// How the skills section renders. "dots"/"bar" show a level; "tags"/"text" don't.
export type SkillsDisplay = "dots" | "bar" | "tags" | "text";

// A custom section is either free rich text or a leveled item list (like skills).
// In "list" mode it reuses SkillItem + SkillsDisplay.
export type CustomMode = "text" | "list";

export interface LanguageItem {
  id: string;
  name: string;
  level: string; // "Natif", "Courant", "Intermédiaire", "Débutant"
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  url: string;
  technologies: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export interface InterestItem {
  id: string;
  name: string;
}

export interface Section {
  id: string;
  type: string;
  title: string;
  content: Record<string, unknown>;
  order: number;
  visible: boolean;
}

export interface Resume {
  id: string;
  title: string;
  language: string;
  template: string;
  style: ResumeStyle;
  isPublic: boolean;
  sections: Section[];
  createdAt: string;
  updatedAt: string;
}

export interface TemplateProps {
  resume: Resume;
}

export const DEFAULT_STYLE: ResumeStyle = {
  primaryColor: "#2563eb",
  fontFamily: "Inter",
  fontSize: 14,
};

export const SECTION_TYPES = [
  { type: "profile", label: "Profil", icon: "user" },
  { type: "experience", label: "Expériences", icon: "briefcase" },
  { type: "education", label: "Formation", icon: "graduation-cap" },
  { type: "skills", label: "Compétences", icon: "star" },
  { type: "languages", label: "Langues", icon: "globe" },
  { type: "projects", label: "Projets", icon: "folder" },
  { type: "certifications", label: "Certifications", icon: "award" },
  { type: "interests", label: "Centres d'intérêt", icon: "heart" },
  { type: "custom", label: "Section personnalisée", icon: "plus" },
] as const;
