# API Routes

All routes under `src/app/api/`. Authenticated routes use the guards in
`src/lib/api-auth.ts` (`requireAuth` for user-scoped routes; `requireResume` /
`requireCoverLetter` for resource routes — these also enforce ownership and
return **404** when not owned). → 401 if the token is missing/invalid. Inputs
validated with Zod (`src/lib/validations.ts`); failures return `validationError`.

> Note: mutations use **PUT** for full/partial updates (not PATCH), except
> `/api/cv/[id]/public` which is PATCH. Delete handlers return a JSON message
> body with 200 (not 204).

## Auth Routes

| Method | Path                        | Body                        | Returns                                                             |
| ------ | --------------------------- | --------------------------- | ------------------------------------------------------------------- |
| POST   | `/api/auth/register`        | `{ email, password, name }` | `{ user, accessToken }` + sets `refresh_token` cookie               |
| POST   | `/api/auth/login`           | `{ email, password }`       | `{ user, accessToken }` + sets `refresh_token` cookie               |
| POST   | `/api/auth/refresh`         | —                           | `{ accessToken }` (reads `refresh_token` cookie)                    |
| POST   | `/api/auth/logout`          | —                           | clears cookie + revokes all user refresh tokens (all devices)       |
| GET    | `/api/auth/me`              | —                           | `{ user }`                                                          |
| PUT    | `/api/auth/me`              | `{ name?, email? }`         | `{ user }` — update profile; 409 if email already used              |
| DELETE | `/api/auth/me`              | —                           | `{ message }` — delete account (cascades resumes/letters/tokens) + clears cookie |
| POST   | `/api/auth/change-password` | `{ currentPassword, newPassword }` | `{ message }` — verifies current pw, rehashes, revokes other sessions; rate-limited 5/15min/user |
| POST   | `/api/auth/forgot-password` | `{ email }`                 | 200 (always — no account enumeration); emails a reset link if found |
| POST   | `/api/auth/reset-password`  | `{ token, password }`       | 200 — consumes `ResetToken`, updates password                       |
| GET    | `/api/auth/sessions`        | —                           | `{ sessions[] }` — active refresh tokens                            |
| DELETE | `/api/auth/sessions`        | `{ id }` / all              | revoke a session (or all)                                           |

## AI Proxy

| Method | Path             | Body                       | Returns                                                                                                                      |
| ------ | ---------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/api/anthropic` | Anthropic messages payload | Streams/returns Anthropic response. Browser→Anthropic CORS proxy; the user's key is forwarded via `x-api-key`, never stored. |

## Resume (CV) Routes

| Method | Path                         | Body                                                 | Returns                                                                              |
| ------ | ---------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| GET    | `/api/cv`                    | —                                                    | `{ resumes[] }` with sections                                                        |
| POST   | `/api/cv`                    | `{ title, language, template }`                      | `{ resume }` — creates with 5 default sections (201)                                 |
| GET    | `/api/cv/[id]`               | —                                                    | `{ resume }` with sections                                                           |
| PUT    | `/api/cv/[id]`               | partial Resume fields + optional `sections[]` batch  | `{ resume }` — metadata + section updates in one tx; rate-limited (30/min/user)      |
| DELETE | `/api/cv/[id]`               | —                                                    | `{ message }`                                                                        |
| POST   | `/api/cv/[id]/duplicate`     | `{ language? }`                                      | `{ resume }` (201) — deep copy; a differing `language` links the copy via `parentId` |
| PATCH  | `/api/cv/[id]/public`        | `{ isPublic: boolean }`                              | `{ isPublic }` — toggles public read-only access                                     |
| GET    | `/api/cv/[id]/share`         | —                                                    | `{ url }` — signed 30-day share link                                                 |
| GET    | `/api/cv/[id]/export`        | `?format=pdf\|docx\|html\|json`                      | binary/text file (Content-Disposition attachment)                                    |
| POST   | `/api/cv/import`             | `{ sections, style, template, language, parentId? }` | `{ resume }`                                                                         |
| POST   | `/api/cv/parse-linkedin-pdf` | `multipart` PDF upload                               | `{ text }` — extracted text for the AI import flow                                   |

### Section Sub-routes

| Method | Path                                | Body                                | Returns                                              |
| ------ | ----------------------------------- | ----------------------------------- | ---------------------------------------------------- |
| GET    | `/api/cv/[id]/sections`             | —                                   | `{ sections[] }`                                     |
| POST   | `/api/cv/[id]/sections`             | `{ type, title, content?, order? }` | `{ section }` (201); auto-assigns `order` if omitted |
| PUT    | `/api/cv/[id]/sections/[sectionId]` | partial Section fields              | `{ section }`                                        |
| DELETE | `/api/cv/[id]/sections/[sectionId]` | —                                   | `{ message }`                                        |
| PUT    | `/api/cv/[id]/sections/reorder`     | `{ sections: [{id, order}] }`       | `{ sections[] }` (transactional)                     |

## Cover Letter Routes

| Method | Path                             | Body                                                 | Returns              |
| ------ | -------------------------------- | ---------------------------------------------------- | -------------------- |
| GET    | `/api/cover-letters`             | —                                                    | `{ coverLetters[] }` |
| POST   | `/api/cover-letters`             | `{ title?, language?, resumeId?, content?, style? }` | `{ coverLetter }`    |
| GET    | `/api/cover-letters/[id]`        | —                                                    | `{ coverLetter }`    |
| PUT    | `/api/cover-letters/[id]`        | partial CoverLetter fields                           | `{ coverLetter }`    |
| DELETE | `/api/cover-letters/[id]`        | —                                                    | `{ message }`        |
| GET    | `/api/cover-letters/[id]/export` | `?format=pdf\|docx\|html`                            | binary/text file     |

## Error Shape

```json
{ "error": "string message", "details"?: <zod flatten> }
```

HTTP status: 400 (validation), 401 (auth), 404 (not found / not owned), **429
(rate limited)**, 500 (server). Resource routes return **404 instead of 403** for
non-owned resources.

## Ownership Check

`requireResume` / `requireCoverLetter` scope the `findFirst` by `userId`, so a
missing-or-unowned resource yields the same 404 — existence is never leaked.

## Rate Limiting

Fixed-window limiter (`src/lib/rate-limit.ts`) with two backends, chosen at load:
**Upstash Redis** (shared across instances) when `UPSTASH_REDIS_REST_URL` +
`UPSTASH_REDIS_REST_TOKEN` are set — required for real enforcement on
Vercel/Lambda — else an **in-memory** fallback (single-instance; dev/tests need
no Redis). `await rateLimitResponse(key, limit, windowMs)` returns a ready 429
(French message + `Retry-After`) or `null`; it fails **open** on a Redis error so
an outage can't lock everyone out. Authenticated routes key by `userId`;
unauthenticated ones by client IP (`getClientIp`).

| Route                          | Key  | Limit       |
| ------------------------------ | ---- | ----------- |
| `auth/login`                   | IP   | 10 / 15min  |
| `auth/register`                | IP   | 5 / hour    |
| `auth/forgot-password`         | IP   | 3 / 15min   |
| `auth/reset-password`          | IP   | 10 / 15min  |
| `auth/change-password`         | user | 5 / 15min   |
| `auth/refresh`                 | IP   | 60 / min    |
| `anthropic` proxy              | IP   | 30 / min    |
| `PUT /api/cv/[id]` (save)      | user | 30 / min    |
| `POST /api/cv` (create)        | user | 20 / min    |
| `POST /api/cv/import`          | user | 10 / min    |
| `POST /api/cv/[id]/duplicate`  | user | 10 / min    |
| `POST /api/cover-letters`      | user | 20 / min    |
| `cv/[id]/export` (non-JSON)    | user | 10 / min    |
| `cover-letters/[id]/export`    | user | 10 / min    |
| `cv/parse-linkedin-pdf`        | user | 10 / min    |
