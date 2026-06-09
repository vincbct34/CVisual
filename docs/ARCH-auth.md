# Auth Architecture

Custom JWT auth. No NextAuth. No session cookies for access — Bearer token only.

## Token Strategy

| Token         | Expiry  | Storage                                                                 | Secret env var       |
| ------------- | ------- | ----------------------------------------------------------------------- | -------------------- |
| Access token  | 15 min  | React state + `access_token` cookie (client-set, `max-age=900`)         | `JWT_SECRET`         |
| Refresh token | 7 days  | `refresh_token` cookie (httpOnly, server-set) + `RefreshToken` DB table | `JWT_REFRESH_SECRET` |
| Share token   | 30 days | none (stateless JWT in the share URL)                                   | `JWT_SECRET`         |
| Render token  | 5 min   | none (stateless JWT in the `?token=` query)                             | `JWT_SECRET`         |

Access token is **not** httpOnly — client reads it to attach as `Authorization: Bearer` header. Constants live in `src/lib/auth.ts` (`ACCESS_TOKEN_EXPIRY`, `REFRESH_TOKEN_EXPIRY`, `SHARE_TOKEN_EXPIRY`, render `"5m"`).

## API Routes

| Route                       | Method     | Purpose                                                                          |
| --------------------------- | ---------- | -------------------------------------------------------------------------------- |
| `/api/auth/register`        | POST       | Hash password (bcrypt), create User, `issueSession` (tokens + cookie)            |
| `/api/auth/login`           | POST       | Verify password, `issueSession`                                                  |
| `/api/auth/refresh`         | POST       | Read `refresh_token` cookie → verify JWT → check DB → issue new access token     |
| `/api/auth/logout`          | POST       | Revoke **all** user refresh tokens from DB (all devices), clear cookie           |
| `/api/auth/me`              | GET/PUT/DELETE | Return user / update profile (`name`,`email`; 409 if email taken) / delete account (cascade) |
| `/api/auth/change-password` | POST       | Verify current password, rehash new one, revoke **other** sessions (keep current); rate-limited 5/15min/user |
| `/api/auth/forgot-password` | POST       | Create a `ResetToken`, email a reset link (always 200 — no enumeration)          |
| `/api/auth/reset-password`  | POST       | Verify + consume `ResetToken`, update `passwordHash`                             |
| `/api/auth/sessions`        | GET/DELETE | List active refresh tokens / revoke one or all (managed at `/settings/sessions`) |

## Password Reset Flow

1. `POST /api/auth/forgot-password` with an email — always returns 200 (no account enumeration).
2. If the account exists, a `ResetToken` row is created and a reset link is emailed via `nodemailer` (SMTP env vars; see `.env.example`).
3. `POST /api/auth/reset-password` with `{ token, password }` verifies and consumes the token, then updates the password.

## Account Management (`/settings/account`)

Logged-in account self-service page, all via `/api/auth/me` + `change-password`:

- **Profile** — `PUT /api/auth/me` updates `name` / `email` (rejects an email already in use with 409).
- **Password** — `POST /api/auth/change-password` checks the current password, rehashes the new one, and revokes every **other** refresh token (current session stays valid). Rate-limited 5/15min/user.
- **Delete account** — `DELETE /api/auth/me` deletes the User (cascade removes resumes, cover letters, refresh + reset tokens) and clears the cookie.

## Client-Side Flow (`src/hooks/use-auth.tsx`)

`AuthProvider` wraps the app. On mount: calls `/api/auth/refresh` to restore session, then `/api/auth/me` to hydrate user.

`authFetch(url, options)` — thin wrapper around `fetch`:

1. Attach current `accessToken` as Bearer.
2. If response is 401 → call `refreshAccessToken()`.
3. Retry original request with new token.

Concurrent refresh calls are deduplicated via `refreshPromiseRef` (mutex ref pattern).

## Server-Side Auth (`src/lib/auth.ts` + `src/lib/api-auth.ts`)

```ts
getAuthFromRequest(request) → JWTPayload | null   // verify Bearer with JWT_SECRET
requireAuth(request) → { auth, response }          // 401 response if unauthenticated
requireResume(request, id, args?) → { resume, auth, response }       // + ownership, 404 if not owned
requireCoverLetter(request, id, args?) → { coverLetter, auth, response }
```

Routes call a guard first; the resource guards scope `findFirst` by `userId` so non-owned resources 404.

Refresh token rotation: a new access token is issued on each refresh, but the same refresh token is reused until expiry (no rotation — validated against the DB row, not just the JWT signature). `issueSession` centralizes token minting + cookie setting.

## Password

bcrypt via `bcryptjs`. Hash stored in `User.passwordHash`.

## Render Auth

Export routes generate a short-lived render token (5-minute JWT signed with
`JWT_SECRET`, containing `{ resourceId, purpose: "render" }`) and pass it as
`?token=` to the headless `/render/[id]` (or `/render/cover-letter/[id]`) page.
That page calls `verifyRenderToken(token, id)` — verifying the signature **and**
that the token's `resourceId` matches the URL param.

## Share Auth

`/api/cv/[id]/share` mints a 30-day share token; `/share/[token]` renders the CV
read-only after `verifyShareToken`. Independent of the `isPublic` flag, which
exposes `/public/cv/[id]` without a token.
