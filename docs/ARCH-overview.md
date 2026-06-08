# Architecture Overview

Next.js 16 app (App Router). PostgreSQL via Prisma 7. No external auth provider — custom JWT.

## Stack

| Layer     | Tech                                                                                               |
| --------- | -------------------------------------------------------------------------------------------------- |
| Framework | Next.js 16.2 (App Router, React 19)                                                                |
| DB        | PostgreSQL + Prisma 7 (`@prisma/adapter-pg`)                                                       |
| Auth      | Custom JWT (`jose`) — access 15m / refresh 7d; bcrypt (`bcryptjs`)                                 |
| Email     | `nodemailer` (password-reset emails via SMTP)                                                      |
| AI        | OpenAI / Gemini / Anthropic (user-supplied key, stored in localStorage)                            |
| Export    | Puppeteer (PDF + HTML capture), `docx` lib (DOCX), JSON                                            |
| Editor    | Tiptap 3 (rich text), dnd-kit (drag-and-drop sections)                                             |
| UI        | shadcn/ui + Tailwind 4; editorial design system (see ARCH-design.md)                               |
| Design    | Light-only "editorial" theme — OKLCH paper/ink tokens, Newsreader/Schibsted Grotesk/JetBrains Mono |
| PWA       | Serwist 9 (service worker)                                                                         |

## Directory Layout

```
src/
  app/                   # Next.js App Router pages + API routes
    (auth)/              # login / register / forgot-password / reset-password (+ auth-card.tsx shell)
    api/                 # REST API handlers
      anthropic/         # browser→Anthropic CORS proxy (key forwarded per request)
      auth/              # login, register, logout, refresh, me, forgot/reset-password, sessions
      cv/                # resume CRUD + sections + export + duplicate + import + public + share + parse-linkedin-pdf
      cover-letters/     # cover letter CRUD + export
    dashboard/           # resume/cover-letter list
    editor/[id]/         # resume editor
    cover-letter/[id]/   # cover letter editor
    render/[id]/         # headless resume render target (Puppeteer hits this)
    render/cover-letter/[id]/  # headless cover-letter render target
    public/cv/[id]/      # public read-only CV (when isPublic)
    share/[token]/       # share-token read-only CV
    settings/sessions/   # active-session management
  components/
    ai/                  # AI action buttons, settings dialog, shared icon/toast helpers
    dashboard/           # cards, header, json-import dialog
    editor/              # section forms, preview, sortable, style panel + style-controls, signature pad, paged preview
    templates/           # 5 CV templates + cover letter template + template-shared / template-utils
    pwa/                 # install prompt
    ui/                  # shadcn primitives + shared bits (logo, file-dropzone, page-loading, motion)
    providers.tsx        # AuthProvider + ThemeProvider (theme forced light)
  hooks/
    use-auth.tsx           # AuthContext: login/register/logout/authFetch
    use-ai.ts              # AI state: provider, model, key, streaming
    use-completeness.ts    # CV completeness score
    use-resizable-panels.ts  # editor split-pane width + collapse (localStorage-persisted)
    use-debounced-autosave.ts # generic debounced save + isSaving flag
  lib/
    auth.ts              # JWT sign/verify (access/refresh/share/render), refresh-token DB ops, cookies
    api-auth.ts          # requireAuth / requireResume / requireCoverLetter route guards
    api-response.ts      # validationError (Zod → 400)
    prisma.ts            # Prisma client singleton
    validations.ts       # Zod schemas for all API inputs
    rate-limit.ts        # in-memory rate limiter (checkRateLimit / getClientIp)
    sanitize.ts          # client DOMPurify wrapper + allowed tags/attrs
    linkedin-parser.ts   # LinkedIn PDF text → structured sections
    utils.ts             # cn, safeFilename, triggerBlobDownload
    export-download.ts   # downloadExport — shared client export→blob→save (resume + cover letter)
    ai/                  # AI client abstraction (see ARCH-ai.md)
    export/              # PDF + DOCX + HTML + JSON generators + puppeteer-render + strip-html
  types/
    resume.ts            # Resume, Section, content item interfaces + DEFAULT_STYLE
    cover-letter.ts      # CoverLetter, CoverLetterContent/Style interfaces + defaults
  generated/prisma/      # Auto-generated Prisma client (do not edit)
```

## Request Flow

```
Browser → Next.js API Route
  → requireAuth / requireResume / requireCoverLetter   (verify Bearer token + ownership)
  → Zod validation (validationError on failure)
  → Prisma query
  → JSON response
```

Client uses `authFetch` from `useAuth` — auto-refreshes expired access tokens via `/api/auth/refresh`. Resource routes use the ownership guards in `lib/api-auth.ts`, which return **404 (not 403)** when a resource isn't owned, to avoid leaking existence.

## Key Constraints

- API keys for AI never persist on the server (localStorage only; Anthropic key is forwarded per request through `/api/anthropic`).
- PDF/HTML export uses Puppeteer server-side: browser → `/api/cv/[id]/export` → Puppeteer → `/render/[id]?token=<5-min render JWT>`. A reused headless Chromium is cached on `globalThis` (see ARCH-export.md).
- French UI (labels, default titles, error messages). Multi-language CV content supported via `Resume.language` and the translation AI flow.
- `parentId` on Resume links translated versions of the same CV.
- CVs can be shared read-only via `isPublic` (`/public/cv/[id]`) or a signed 30-day share token (`/share/[token]`).
