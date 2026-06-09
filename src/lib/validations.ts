import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  name: z.string().min(1, "Le nom est requis").max(100),
});

export const loginSchema = z.object({
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export const updateProfileSchema = z
  .object({
    name: z.string().min(1, "Le nom est requis").max(100).optional(),
    email: z
      .string()
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email invalide")
      .optional(),
  })
  .refine((data) => data.name !== undefined || data.email !== undefined, {
    message: "Aucune modification fournie",
  });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export const createResumeSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  language: z.string().min(2).max(5).optional(),
  template: z
    .enum(["classic", "modern", "minimal", "creative", "professional"])
    .optional(),
});

export const resumeStyleSchema = z.object({
  primaryColor: z.string().max(20).optional(),
  fontFamily: z.string().max(100).optional(),
  fontSize: z.number().min(8).max(48).optional(),
  headingScale: z.number().min(0.5).max(2).optional(),
  metaScale: z.number().min(0.5).max(2).optional(),
  photoShape: z.enum(["circle", "rounded", "square"]).optional(),
  photoSize: z.number().min(48).max(200).optional(),
  sidebarSections: z.array(z.string()).max(50).optional(),
});

export const updateResumeSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  language: z.string().min(2).max(5).optional(),
  template: z
    .enum(["classic", "modern", "minimal", "creative", "professional"])
    .optional(),
  style: resumeStyleSchema.optional(),
});

export const createSectionSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1).max(200),
  content: z.any().optional(),
  order: z.number().int().min(0).optional(),
  visible: z.boolean().optional(),
});

export const updateSectionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.any().optional(),
  order: z.number().int().min(0).optional(),
  visible: z.boolean().optional(),
});

export const reorderSectionsSchema = z.object({
  sections: z.array(
    z.object({
      id: z.string(),
      order: z.number().int().min(0),
    }),
  ),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateResumeInput = z.infer<typeof createResumeSchema>;
export type UpdateResumeInput = z.infer<typeof updateResumeSchema>;
export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
const coverLetterContentSchema = z.object({
  recipientName: z.string().max(200).default(""),
  companyName: z.string().max(200).default(""),
  jobTitle: z.string().max(200).default(""),
  body: z.string().default(""),
  senderName: z.string().max(200).optional(),
  senderEmail: z.string().max(200).optional(),
  senderPhone: z.string().max(100).optional(),
  senderLocation: z.string().max(200).optional(),
  date: z.string().max(200).optional(),
  dateCity: z.string().max(120).optional(),
  dateValue: z.string().max(40).optional(),
  signature: z.string().max(200).optional(),
  signatureMode: z.enum(["typed", "draw", "upload"]).optional(),
  signatureImage: z.string().max(3_000_000).optional(),
});

const coverLetterStyleSchema = z.object({
  fontFamily: z.string().max(100).default("Inter"),
  fontSize: z.number().min(8).max(24).default(14),
  primaryColor: z.string().max(20).default("#1a1a1a"),
  lineHeight: z.number().min(1).max(2.5).optional(),
  textAlign: z.enum(["left", "justify"]).optional(),
  accent: z.enum(["minimal", "line", "band"]).optional(),
  headingScale: z.number().min(0.5).max(2).optional(),
  metaScale: z.number().min(0.5).max(2).optional(),
});

export const createCoverLetterSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  language: z.string().min(2).max(5).optional(),
  resumeId: z.string().optional().nullable(),
  content: coverLetterContentSchema.optional(),
  style: coverLetterStyleSchema.optional(),
});

export const updateCoverLetterSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  language: z.string().min(2).max(5).optional(),
  content: coverLetterContentSchema.optional(),
  style: coverLetterStyleSchema.optional(),
});

export type ReorderSectionsInput = z.infer<typeof reorderSectionsSchema>;

// ── Import CV ────────────────────────────────────────────────────

const importSectionSchema = z.object({
  type: z.enum([
    "profile",
    "experience",
    "education",
    "skills",
    "languages",
    "projects",
    "certifications",
    "interests",
    "custom",
  ]),
  title: z.string().min(1).max(200),
  content: z.record(z.string(), z.unknown()),
  order: z.number().int().min(0).optional(),
  visible: z.boolean().optional(),
});

export const importResumeSchema = z.object({
  title: z.string().min(1, "Titre requis").max(200),
  language: z.string().min(2).max(5).optional(),
  template: z
    .enum(["classic", "modern", "minimal", "creative", "professional"])
    .optional(),
  style: resumeStyleSchema.optional(),
  sections: z.array(importSectionSchema).max(30, "Maximum 30 sections"),
});

export type ImportResumeInput = z.infer<typeof importResumeSchema>;
export type CreateCoverLetterInput = z.infer<typeof createCoverLetterSchema>;
export type UpdateCoverLetterInput = z.infer<typeof updateCoverLetterSchema>;
