# Deployment

CVisual is a standard Next.js 16 app; it deploys anywhere that runs Node 20+. The
one non-trivial piece is the Puppeteer-based PDF/HTML export, which needs a
Chromium binary at runtime.

## Prerequisites

- A reachable **PostgreSQL** database (`DATABASE_URL`).
- Strong secrets for `JWT_SECRET` and `JWT_REFRESH_SECRET` (e.g. `openssl rand -base64 32`).
- `NEXT_PUBLIC_APP_URL` set to the deployed origin — Puppeteer navigates to
  `${NEXT_PUBLIC_APP_URL}/render/[id]` to capture the PDF/HTML, so it **must**
  match the public URL (not `localhost`) in production.
- Optional SMTP vars for password-reset emails.

See [`../README.md`](../README.md) for the full env table.

## Build & run

```bash
npm ci                 # installs deps; postinstall runs `prisma generate`
npx prisma migrate deploy   # apply migrations to the target database
npm run build
npm start              # serves the production build
```

## Vercel (and other serverless)

Export is environment-aware (`src/lib/export/puppeteer-render.ts`):

- **Serverless** (Vercel / Lambda) uses `@sparticuz/chromium` + `puppeteer-core`.
- **Local/dev** uses the full `puppeteer` dev dependency.

Notes:

- The export routes set `maxDuration = 60`; cold Chromium launch dominates the
  first request, then the browser is cached on `globalThis` and reused.
- Run database migrations (`prisma migrate deploy`) as a release/build step — the
  app does not migrate at runtime.
- Set every env var in the platform's project settings; AI keys are **not** server
  env vars (they live in the user's browser localStorage).

## Database

Migrations live in `prisma/migrations/`. For a fresh environment:

```bash
npx prisma migrate deploy   # production: apply existing migrations
# or, for a throwaway/dev DB:
npx prisma db push
```
