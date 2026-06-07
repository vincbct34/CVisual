# Changelog

All notable changes to this project are documented here. Format based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning aims to
follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This file starts at the current pre-release state — there is no prior release
history to reconstruct.

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

[0.1.0]: https://github.com/vincbct34/CVisual/releases/tag/v0.1.0
