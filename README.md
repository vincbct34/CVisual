# CVisual

A resume & cover-letter builder. Write CVs in multiple languages, style them with
5 templates, and export pixel-accurate PDF/HTML (Puppeteer), editable DOCX, or
reimportable JSON. Optional AI assistance (OpenAI / Gemini / Anthropic) improves
text, generates summaries and cover letters, scores against a job description, and
translates a CV — all with a **user-supplied key that never persists on the server**.

French UI throughout.

## Stack

Next.js 16 (App Router, React 19) · PostgreSQL + Prisma 7 · custom JWT auth
(`jose`, bcrypt) · Tiptap 3 + dnd-kit editor · shadcn/ui + Tailwind 4 · Puppeteer
and `docx` export · Serwist 9 PWA. See [`docs/ARCH-overview.md`](docs/ARCH-overview.md).

## Quick Start

```bash
# 1. Install (runs `prisma generate` via postinstall)
npm install

# 2. Configure environment
cp .env.example .env        # then fill in the values (see below)

# 3. Create the database schema
npx prisma migrate dev      # or: npx prisma db push

# 4. Run
npm run dev                 # http://localhost:3000
```

### Environment variables (`.env`)

| Var                                             | Purpose                                                              |
| ----------------------------------------------- | -------------------------------------------------------------------- |
| `DATABASE_URL`                                  | PostgreSQL connection string                                         |
| `JWT_SECRET`                                    | Signs access / render / share tokens                                 |
| `JWT_REFRESH_SECRET`                            | Signs refresh tokens                                                 |
| `NEXT_PUBLIC_APP_URL`                           | Base URL (used by Puppeteer export; default `http://localhost:3000`) |
| `SMTP_HOST` / `PORT` / `USER` / `PASS` / `FROM` | Password-reset emails (optional in dev)                              |

Use strong, unique secrets in production (e.g. `openssl rand -base64 32`). AI keys
are **not** env vars — users enter them in-app; they live only in the browser's
localStorage.

## Scripts

| Script              | Does                                             |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Dev server                                       |
| `npm run build`     | Production build                                 |
| `npm start`         | Serve the production build                       |
| `npm run lint`      | ESLint (`lint:fix` to autofix)                   |
| `npm run typecheck` | `tsc --noEmit`                                   |
| `npm run format`    | Prettier write (`format:check` to verify)        |
| `npm test`          | Vitest (watch); `test:run` once; `test:coverage` |

## Testing

Vitest (node env) covers the pure logic: auth, validations, rate-limiting, AI
provider adapters, the LinkedIn parser, template + HTML-flatten utils. There is
**no UI/E2E layer yet** — editor, drag-and-drop, and export flows aren't covered
by automated tests.

## Architecture

Per-area docs live in [`docs/`](docs/) and are loaded as context for AI agents
(via `CLAUDE.md`):

- [Overview](docs/ARCH-overview.md) · [Auth](docs/ARCH-auth.md) · [Data model](docs/ARCH-data.md)
- [API routes](docs/ARCH-api.md) · [AI](docs/ARCH-ai.md) · [Export](docs/ARCH-export.md)
- [Templates](docs/ARCH-templates.md) · [Editor](docs/ARCH-editor.md)

## Deployment

Targets Vercel (env-aware Puppeteer via `@sparticuz/chromium`). See
[`docs/DEPLOY.md`](docs/DEPLOY.md).

## License

Proprietary — see [`LICENSE`](LICENSE). The source is publicly viewable but **not**
open source: all rights reserved by the owner; no use, copying, modification, or
redistribution without prior written permission.
