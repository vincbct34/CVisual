# Design System

Editorial / print-inspired direction: paper-and-ink palette, serif display type,
hairline rules, hard offset shadows, sharp ~4px corners. **Light mode only.**
Single source of truth is `src/app/globals.css`.

## Type

Loaded via `next/font/google` in `src/app/layout.tsx`. The CSS variable names are
kept legacy on purpose so the whole app inherits the new fonts with no per-file
churn:

| Role           | Font              | CSS var (`globals.css` alias) |
| -------------- | ----------------- | ----------------------------- |
| Serif display  | Newsreader        | `--serif` (`--font-outfit`)   |
| Grotesk body   | Schibsted Grotesk | `--sans` (`--font-inter`)     |
| Mono / labels  | JetBrains Mono    | `--mono` (`--font-geist-mono`)|

Headings (`h1`–`h6`) default to `--serif` via base styles.

## Color tokens (OKLCH)

Defined once in `:root`. There is **no `.dark` block** — `providers.tsx` sets
`forcedTheme="light"`. Editing a token in `:root` is the only place a color lives.

- **Paper / ink:** `--paper`, `--paper-2`, `--ink`, `--ink-soft`, `--ink-faint`
- **Lines:** `--line`, `--line-soft`
- **Accent (brique):** `--accent`, `--accent-strong`, `--accent-soft`, `--accent-tint`
- **Status:** `--success(-soft)`, `--warning(-soft)`, `--destructive(-soft)`
- **Radius:** `--radius` (0.25rem)
- Legacy aliases (`--bg`/`--fg`/`--fg-muted`/`--accent-violet`/`--gradient-cta`)
  are remapped onto the editorial values so older component styles still resolve.

shadcn primitives are themed centrally through `[data-slot="…"]` overrides in
`globals.css` (sharp radius, flat paper surfaces, offset shadows) — not per file.

## Shared classes

Reusable, so components avoid bespoke inline styling:

- `.btn-gradient` (solid-ink CTA), `.btn-ghost` (line button), `.btn-chip`
  (small secondary), `.btn-danger`
- `.glass-card` (flat paper card + offset shadow), `.glass-toolbar` (sticky bar),
  `.glass-panel` (editor sidebar) — names are legacy; there is no glassmorphism
- `.ed-tag` / `.ed-tag-accent` (mono badges), `.icon-btn` (square icon button),
  `.kicker`, `.text-gradient` (now solid brique)

> Inline `style={{ color: "var(--fg)" }}` etc. is intentional — each reads a single
> token, so it is already centralized "by variable." Prefer tokens/classes over raw
> color/radius literals; the only literals left are domain data (the CV color
> picker swatches, sample data) or platform values (PWA `themeColor`, print `#fff`).

## Landing page

`src/app/page.tsx` (client) + scoped `src/app/landing.css` (everything under
`.landing`). Reuses the global tokens; holds only page-specific layout
(masthead, ticker, hero with a real scaled `ClassicTemplate` mockup, feature
grid, CTA, footer).

## Shared UI components

`Logo` (`ui/logo.tsx`), `FileDropzone` (`ui/file-dropzone.tsx`), `PageLoading`
(`ui/page-loading.tsx`), and the `motion.tsx` animation wrappers (`FadeUp`,
`StaggerList`/`StaggerItem`, `AnimatedCard`).
