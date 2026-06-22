# Changelog

All notable changes to this project are documented here. Format based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning aims to
follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This file starts at the current pre-release state — there is no prior release
history to reconstruct.

## [0.3.0] - 2026-06-22

### Added

- **Internationalization** with French and English routes under `/:lang`, typed
  dictionaries, localized navigation helpers, a language switcher, localized
  metadata/marketing/legal/auth/editor UI, and request-aware API messages.

### Fixed

- Locale redirects now handle generated `/share/<token>` links whose JWT tokens
  contain dot separators, while static assets with file extensions remain skipped
  by the proxy matcher.

## [0.2.0] - 2026-06-09

### Added

- **Account management** page (`/settings/account`): update profile (`PUT /api/auth/me`),
  change password (`POST /api/auth/change-password` — revokes other sessions),
  and delete account (`DELETE /api/auth/me`, cascade).
- Password **visibility toggle** on the auth forms.
- **Legal pages**: `/cgu`, `/confidentialite`, `/mentions-legales`; donation +
  legal links in the landing footer.
- **SEO marketing pages**: `/modeles`, `/ia`, `/export`, sharing a `LandingShell`
  (`components/landing/landing-shell.tsx`) masthead/footer wrapper.
- `lib/sample-resume.ts` (`SAMPLE_SECTIONS`) for the landing mockup / previews.
- **Upstash Redis** rate-limit backend (shared across instances) with an
  in-memory fallback; `rateLimitResponse` helper + per-route limits.

### Changed

- Refactored the UI to a **light-only editorial design system** (paper/ink OKLCH
  tokens, Newsreader / Schibsted Grotesk / JetBrains Mono); legacy CSS var names
  remapped (see `docs/ARCH-design.md`).
- Replaced `useDebouncedAutosave` with **`useAutosave`** (`hooks/use-autosave.ts`):
  manual Save (`flush`) + periodic max-wait autosave (≤30s while dirty), exposing
  `isSaving` / `isDirty`. Resume saves now batch `sections[]` into one
  transactional `PUT /api/cv/[id]`.

## [0.1.0] - 2026-06-07

### Added

- Anthropic as a third AI provider (Claude), alongside OpenAI and Gemini, via a
  same-origin `/api/anthropic` proxy (browser CORS); shared `SparklesIcon` +
  no-key toast helpers (`ai-shared.tsx`).
- Ownership route guards `requireResume` / `requireCoverLetter` (`lib/api-auth.ts`).
- Shared editor hooks `useDebouncedAutosave` and `useResizablePanels`.
- Shared style primitives (`editor/style-controls.tsx`) used by both style panels.
- `triggerBlobDownload` and `stripHtml` (`export/strip-html.ts`) utilities.
- Project README and this changelog; all `docs/ARCH-*.md` synced to the code.
- Tests for AI provider adapters and the HTML-flatten util.

### Changed

- Renamed the project **CVMaker → CVisual** (package name, branding/UI, PWA
  manifest, docs). localStorage keys `cvmaker_*` are migrated to `cvisual_*` on
  first load, so existing local settings (API key/model/provider) are preserved.
- Collapsed the three duplicated AI provider clients into an engine
  (`ai/provider-core.ts`) + per-provider adapters (`ai/providers.ts`); public
  `callAI`/`streamAI`/`validateKey` API unchanged.
- Cover-letter **HTML export** now renders through Puppeteer (matching the PDF)
  instead of a hand-maintained CSS subset.
- Deduplicated the auth-route preamble across ~10 API handlers, the auth-page
  card chrome (`(auth)/auth-card.tsx`), AI buttons, dashboard cards, and the
  section-form item rows.

### Removed

- Deleted the separate `ai/openai-client.ts`, `gemini-client.ts`,
  `anthropic-client.ts` (folded into the adapter engine).

[0.3.0]: https://github.com/vincbct34/CVisual/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/vincbct34/CVisual/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/vincbct34/CVisual/releases/tag/v0.1.0
