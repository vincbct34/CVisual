# Export System

Four formats: **PDF** and **HTML** (both via Puppeteer rendering the real
template), **DOCX** (`docx` lib), and **JSON** (raw reimportable data, CV only).
All triggered via `GET /api/cv/[id]/export?format=…` (cover letters:
`pdf|docx|html`).

## Shared Puppeteer Renderer (`src/lib/export/puppeteer-render.ts`)

PDF and HTML both flow through one renderer so every format is pixel-identical:

```
withRenderedResume(id, capture)       // → /render/[id]
withRenderedCoverLetter(id, capture)  // → /render/cover-letter/[id]
```

- A single headless Chromium is **reused** across exports, cached on `globalThis`
  (cold launch dominates latency; relaunched if it disconnects).
- Env-aware launch: serverless (Vercel/Lambda) uses `@sparticuz/chromium` +
  `puppeteer-core`; locally the full `puppeteer` dev dependency.
- Navigation waits for `domcontentloaded` (the render page is fully server-rendered;
  `networkidle` would hang on the dev HMR socket), 20s timeout, then waits for
  `document.fonts.ready` capped at 1.5s so metrics are final.
- A fresh page is signed with a 5-min render token immediately before `goto`, run
  through `capture`, and always closed.

`capturePageHtml(page)` serializes the rendered page into a self-contained HTML
document with every stylesheet inlined (and Next dev overlays stripped) — so the
`.html` export carries the exact template styling with no external requests.

## PDF Export (`src/lib/export/pdf.ts`, `cover-letter-pdf.ts`)

```
GET …/export?format=pdf
  → generatePDF(id) = withRenderedResume(id, page => page.pdf(...))
  → Response: application/pdf attachment
```

- Resume PDF uses `printBackground: true` + `preferCSSPageSize: true` (the template's
  CSS `@page` box controls size + per-page margins).
- Cover-letter PDF uses `format: "A4"`, `printBackground: true`, margins 0.

`/render/[id]` (and `/render/cover-letter/[id]`) server components: validate
`?token` via `verifyRenderToken(token, id)`, fetch from DB directly (no auth
header), render the chosen template with print CSS, no UI chrome.

**Env required:** `NEXT_PUBLIC_APP_URL` (defaults `http://localhost:3000`), `JWT_SECRET`. Export routes set `maxDuration = 60`.

## HTML Export (`src/lib/export/html.ts`, `cover-letter-html.ts`)

Both call the shared renderer with `capturePageHtml` — `generateHTML(id)` and
`generateCoverLetterHTML(id)`. Produces the same styling as the PDF (no
hand-maintained CSS subset).

## DOCX Export (`src/lib/export/docx.ts`, `cover-letter-docx.ts`)

Pure server-side, no browser:

```
GET …/export?format=docx
  → fetch from DB → generateDOCX(sections, style, title) → Packer.toBuffer → Uint8Array
```

Section rendering (resume): `profile` → centered header; `experience`/`education`
→ right-tab dates; `skills`/`languages`/`interests` → dot-joined line;
`projects`/`certifications` → details; `custom` → list or plain paragraph. The
cover letter renders sender/recipient/objet/body/signature (signature image
embedded via `ImageRun`).

HTML in section content is flattened with the shared `stripHtml` (`export/strip-html.ts`)
— rich formatting isn't preserved in DOCX. Font: Calibri. Color from
`style.primaryColor` (near-white accents darkened for legibility). Size sliders
(`fontSize`/`headingScale`/`metaScale`) map onto docx half-point sizes.

## JSON Export (CV only)

`format=json` returns the resume (minus `userId`) as an attachment — clean and reimportable via `POST /api/cv/import`.

## Client Download

API returns the file with `Content-Disposition: attachment`. The browser save is
triggered by `triggerBlobDownload(blob, filename)` (`src/lib/utils.ts`), shared by
the editors and the cover-letter card.
