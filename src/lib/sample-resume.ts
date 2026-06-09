import type { Resume, Section } from "@/types/resume";

// Sample CV used across the marketing surface (landing hero + /modeles
// showcase). It is fed to the *real* template components, so every mockup
// always matches a template that actually ships in the app.
export const SAMPLE_SECTIONS: Section[] = [
  {
    id: "s-profile",
    type: "profile",
    title: "Profil",
    order: 0,
    visible: true,
    content: {
      fullName: "Camille Laurent",
      jobTitle: "Cheffe de projet digital",
      summary:
        "<p>Cheffe de projet avec 6 ans d'expérience en pilotage de produits web, de la conception à la livraison.</p>",
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
  {
    id: "s-lang",
    type: "languages",
    title: "Langues",
    order: 4,
    visible: true,
    content: {
      items: [
        { id: "l1", name: "Français", level: "Natif" },
        { id: "l2", name: "Anglais", level: "Courant" },
        { id: "l3", name: "Espagnol", level: "Intermédiaire" },
      ],
    },
  },
];

export const SAMPLE_RESUME: Resume = {
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

// The 5 shipped templates, each given a distinct accent so the showcase reads
// as a varied gallery rather than the same CV recolored once.
export const TEMPLATE_SHOWCASE: {
  key: string;
  name: string;
  tagline: string;
  color: string;
}[] = [
  {
    key: "classic",
    name: "Classique",
    tagline: "Sobre et intemporel",
    color: "#9e4a2d",
  },
  {
    key: "modern",
    name: "Moderne",
    tagline: "Colonne latérale structurée",
    color: "#2d5b9e",
  },
  {
    key: "minimal",
    name: "Minimal",
    tagline: "Tout en typographie",
    color: "#3a3a3a",
  },
  {
    key: "creative",
    name: "Créatif",
    tagline: "Accent visuel affirmé",
    color: "#9e2d6b",
  },
  {
    key: "professional",
    name: "Professionnel",
    tagline: "Pensé pour les ATS",
    color: "#2d7d5a",
  },
];

// A copy of the sample CV restyled for a given template key.
export function sampleForTemplate(key: string, color: string): Resume {
  return {
    ...SAMPLE_RESUME,
    template: key,
    style: { ...SAMPLE_RESUME.style, primaryColor: color },
  };
}
