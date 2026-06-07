# Data Model

PostgreSQL via Prisma 7. Client output at `src/generated/prisma/` (auto-generated, do not edit). Schema at `prisma/schema.prisma`.

## Schema Summary

```
User
  id, email (unique), passwordHash, name, createdAt, updatedAt
  → resumes[]
  → coverLetters[]
  → refreshTokens[]
  → resetTokens[]

RefreshToken
  id, token (unique), userId, expiresAt, createdAt
  index: userId

ResetToken
  id, token (unique), userId, expiresAt, createdAt
  userId → User (cascade delete)
  index: userId

Resume
  id, title, language, template, style (Json), isPublic (Boolean, default false), createdAt, updatedAt
  userId → User (cascade delete)
  sections[]
  parentId → Resume (self-ref: translation parent, SetNull on delete)
  translations[] → Resume[]
  index: userId, parentId

Section
  id, type, title, content (Json), order, visible
  resumeId → Resume (cascade delete)
  index: resumeId

CoverLetter
  id, title, content (Json), style (Json), language, resumeId?, createdAt, updatedAt
  userId → User (cascade delete)
  index: userId
```

## JSON Column Shapes

Types live in `src/types/resume.ts` and `src/types/cover-letter.ts`.

**`Resume.style`** → `ResumeStyle`:

```ts
{
  primaryColor: string,
  fontFamily: string,
  fontSize: number,          // body text base, px
  headingScale?: number,     // multiplier for names + section titles (default 1)
  metaScale?: number,        // multiplier for dates + contact/meta (default 1)
  photoShape?: "circle" | "rounded" | "square",
  photoSize?: number,        // px
  sidebarSections?: string[] // section ids placed in the sidebar (modern/creative)
}
```

**`Section.content`** — varies by `Section.type`:

```
profile       → ProfileContent (fullName, jobTitle, summary, email, phone, location, website, photoBase64?, customFields?[])
experience    → { items: ExperienceItem[] }
education     → { items: EducationItem[] }
skills        → { items: SkillItem[], display?: "dots"|"bar"|"tags"|"text" }  // level 1-5; dots/bar show level
languages     → { items: LanguageItem[] }    // level: "Natif"|"Courant"|"Intermédiaire"|"Débutant"
projects      → { items: ProjectItem[] }
certifications→ { items: CertificationItem[] }
interests     → { items: InterestItem[] }
custom        → { mode?: "text"|"list", text?: string, items?: SkillItem[], display? }  // "text" = Tiptap HTML; "list" reuses the skills shape
```

`ProfileContent.customFields` is `{ id, label, value }[]` (extra contact rows); `photoBase64` is a downscaled data URL.

**`CoverLetter.content`** → `CoverLetterContent`:

```ts
{
  recipientName, companyName, jobTitle, body,   // body is Tiptap HTML
  senderName?, senderEmail?, senderPhone?, senderLocation?,
  date?, dateCity?, dateValue?,                 // composed + picker parts
  signature?, signatureMode?: "typed"|"draw"|"upload", signatureImage?  // image is a data URL
}
```

**`CoverLetter.style`** → `CoverLetterStyle`:

```ts
{
  fontFamily: string, fontSize: number, primaryColor: string,
  lineHeight?: number,                  // default 1.5
  textAlign?: "left" | "justify",       // body alignment, default "left"
  accent?: "minimal" | "line" | "band", // header treatment, default "minimal"
  headingScale?: number, metaScale?: number
}
```

## Section Types

Defined in `src/types/resume.ts` as the `SECTION_TYPES` const array:
`profile | experience | education | skills | languages | projects | certifications | interests | custom`

## Multi-language CV

`Resume.parentId` links a translated CV to its original. The UI creates a
translated copy (AI-translated content) via `POST /api/cv/[id]/duplicate` with a
target `language`, linked through this self-relation. Deleting a parent sets
`parentId` to null on children (SetNull).

## Sharing

`Resume.isPublic` exposes a read-only `/public/cv/[id]`. A signed 30-day share
token (no DB row) backs `/share/[token]` independently of `isPublic`.

## Prisma Config

`prisma.config.ts` at project root. Connection via `DATABASE_URL` env var (pg adapter). Singleton client at `src/lib/prisma.ts` to avoid connection exhaustion in dev.
