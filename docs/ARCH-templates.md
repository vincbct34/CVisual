# CV Templates

5 CV templates + 1 cover letter template. Plain React components.

## Template Registry (`src/components/templates/index.ts`)

```ts
TEMPLATES: Record<string, { name: string; component: ComponentType<TemplateProps> }>;
getTemplate(key): ComponentType<TemplateProps>; // falls back to a default
```

Keys (also stored as `Resume.template`):
| Key | Display name |
|-----|-------------|
| `classic` | Classique |
| `modern` | Moderne |
| `minimal` | Minimal |
| `creative` | Créatif |
| `professional` | Professionnel |

**Static registry — not `next/dynamic`.** A static map lets the same components
render on the server (render page, HTML export) and the client (editor preview)
without a hydration race.

## `TemplateProps`

```ts
interface TemplateProps {
  resume: Resume; // includes sections[]
}
```

Templates read sections, filter by `visible`, sort by `order`, and render.

## Shared Template Code

- **`template-shared.tsx`** — section-rendering building blocks reused by all 5:
  `RichText`, `SkillDots`, `SkillBar`, `Entry`, `SectionContent` (renders a
  section by type), `sectionHasContent`. This is where per-type rendering lives;
  individual templates are mostly layout + styling around it (each 85–141 lines).
- **`template-utils.ts`** — pure helpers: color (`withAlpha`, `readableTextColor`,
  `accentTextOnLight`), layout (`getPhotoStyle`, `getRootFontStyle`, `FS` size
  scale, `defaultSidebarTypes`, `isSidebarSection`), section accessors
  (`getProfile`, `getExperiences`, `getSkills`, … `getVisibleSections`),
  `getContactLines`, `formatDate`, `isHtml`, and `sanitize` (isomorphic DOMPurify).
- **`resume-document.tsx`** (`ResumeDocument`) — paginates a template into A4 pages
  for the render/export target.
- **`page-background.ts`** — sidebar page-background + top-margin helpers
  (`sidebarPageBackground`, `pageTopMarginMm`, `PAGE_TOP_MARGIN_MM`).

Sanitized Tiptap HTML is rendered through `RichText` (in `template-shared.tsx`),
which wraps the isomorphic `sanitize` helper from `template-utils.ts`.

## Template Conventions

Each template:

- Reads `resume.style` (`primaryColor`, `fontFamily`, `fontSize`, optional
  `headingScale`/`metaScale`/`photoShape`/`photoSize`/`sidebarSections`).
- Uses `template-shared` + `template-utils` for content + helpers (no per-template
  duplication of section rendering).
- Renders sanitized rich text via `RichText`.
- Renders at A4 proportions for PDF accuracy. Print CSS via Tailwind + inline styles.

## Cover Letter Template (`src/components/templates/cover-letter-template.tsx`)

Single template. Header treatment from `style.accent` (`minimal|line|band`).
Renders: sender header → recipient block → objet/job line → `body` HTML
(sanitized) → signature (typed / drawn / uploaded image).

## Render Pages

`/render/[id]` and `/render/cover-letter/[id]` — server components that validate
the render token, fetch from DB, and render the template (resume via
`ResumeDocument`) with print-optimized CSS, no navigation chrome. These are the
Puppeteer targets for PDF/HTML export — not for direct user navigation.
