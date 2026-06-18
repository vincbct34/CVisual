---
name: design-system
description: CVisual editorial design system — paper/ink OKLCH tokens, serif display type, hairline rules, hard offset shadows. Use when building or styling any UI in this app (pages, components, dialogs, buttons, cards) so new code matches the editorial direction instead of inventing colors, fonts, radii, or shadows.
---

# CVisual Editorial Design System

Print-inspired, **light mode only** (`providers.tsx` sets `forcedTheme="light"` — never add `.dark` styles). Single source of truth: `src/app/globals.css`. Landing-specific layout lives in `src/app/landing.css` (scoped under `.landing`).

**Golden rule: never invent a color, font, radius, or shadow. Use a token or shared class.** The only acceptable raw literals are domain data (CV color-picker swatches, sample resume data) and platform values (PWA `themeColor`, print `#fff`).

## Aesthetic in one line

Paper and ink. Warm off-white surfaces, dark warm-gray text, one "brique" (brick) accent, hairline borders, **hard offset shadows** (no blur), sharp ~4px corners, serif display headings, mono micro-labels, subtle paper grain. No gradients, no glassmorphism, no dark mode.

## Color tokens (OKLCH, defined once in `:root`)

| Token                                                            | Role                                                            |
| ---------------------------------------------------------------- | --------------------------------------------------------------- |
| `--paper` / `--paper-2`                                          | page background / subtle secondary surface (inputs, footers)    |
| `--ink` / `--ink-soft` / `--ink-faint`                           | text / muted text / faintest (scrollbar hover)                  |
| `--line` / `--line-soft`                                         | hairline borders / softer rules                                 |
| `--accent`                                                       | brique `oklch(0.52 0.13 42)` — fills, progress                  |
| `--accent-strong`                                                | darker brique — hover states, focus ring, links, active toggles |
| `--accent-soft`                                                  | pale brique tint — focus glow, menu-item hover, selected chips  |
| `--accent-tint`                                                  | text selection                                                  |
| `--success(-soft)` / `--warning(-soft)` / `--destructive(-soft)` | status text + soft tint fills                                   |
| `--radius`                                                       | `0.25rem` — sharp corners everywhere                            |

Legacy aliases still resolve (`--bg`, `--fg`, `--fg-muted`, `--accent-violet`, `--gradient-cta` → now solid ink, etc.) — fine to read in old code, **prefer the editorial names in new code**. All shadcn tokens (`--background`, `--primary`, `--muted`…) are remapped onto these; `--primary` is **ink**, not the accent.

Inline `style={{ color: "var(--fg)" }}` is an accepted idiom — one token per usage keeps it centralized.

## Typography

Loaded via `next/font/google` in `src/app/layout.tsx`. CSS var names are intentionally legacy — do not "fix" them:

| Role          | Font              | Use via                                                                                                    |
| ------------- | ----------------- | ---------------------------------------------------------------------------------------------------------- |
| Serif display | Newsreader        | `var(--serif)` or `.font-heading` — headings get it by default (`h1`–`h6`, weight 600, `-0.02em` tracking) |
| Body          | Schibsted Grotesk | `var(--sans)` — html default                                                                               |
| Mono / labels | JetBrains Mono    | `var(--mono)` or `.mono` — badges, kickers, meta chips                                                     |

(`--font-outfit` = serif, `--font-inter` = sans, `--font-geist-mono` = mono. Legacy names, repointed.)

## Signature shadow

Hard offset, zero blur, two layers:

```css
box-shadow:
  6px 7px 0 -1px var(--paper-2),
  6px 7px 0 0 var(--line);
/* hover: 8px 9px, second layer var(--ink), translateY(-2px) */
/* dialogs: 10px 12px offsets with var(--ink) */
```

Don't write this by hand — it ships with `.glass-card`, `[data-slot="card"]`, dialog/select/dropdown overrides.

## Shared classes (use these before writing custom CSS)

| Class                                      | What                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------ |
| `.btn-gradient`                            | primary CTA — solid ink, brique on hover, lifts 1px (name legacy; no gradient) |
| `.btn-ghost`                               | outline button — ink border, inverts on hover                                  |
| `.btn-chip`                                | small secondary — paper, hairline border                                       |
| `.btn-danger`                              | destructive outline, fills red on hover                                        |
| `.icon-btn`                                | 2rem square icon button                                                        |
| `.glass-card`                              | flat paper card + offset shadow + hover lift (name legacy; no glass)           |
| `.glass-toolbar`                           | sticky bar — paper at 0.82 alpha + blur for legibility (only sanctioned blur)  |
| `.glass-panel`                             | editor sidebar surface                                                         |
| `.ed-tag` / `.ed-tag-accent`               | mono micro-badges (template/language chips)                                    |
| `.kicker`                                  | mono uppercase section label, `0.08em` tracking; `.num` child in accent        |
| `.text-gradient`                           | now solid brique text (legacy name)                                            |
| `.accent-link`                             | brique link                                                                    |
| `.wrap`                                    | page container — `max-width: var(--maxw)` (1240px), 36px padding (22px ≤560px) |
| `.completeness-bar` / `.completeness-fill` | progress bar                                                                   |
| `.rte-container` / `.rte-toolbar(-btn)`    | Tiptap editor chrome                                                           |

## shadcn components

Primitives in `src/components/ui/` are themed **centrally** via `[data-slot="…"]` overrides in `globals.css` — buttons, cards, inputs, tabs, selects, dropdowns, dialogs, badges, textareas already look editorial. **Do not restyle them per-file**; if a primitive looks wrong, fix the `data-slot` override once in `globals.css`.

Button variant semantics: default = solid ink CTA, `outline` = line button, `ghost` = transparent, `secondary` = paper-2, `destructive` = red outline that fills on hover.

## Motion (`src/components/ui/motion.tsx`)

framer-motion wrappers: `FadeUp` (mount fade from 30px below), `StaggerList`/`StaggerItem` (0.12s stagger, spring 80/15), `AnimatedCard` (hover lift + hard-shadow swap). Import `motion` directly from `framer-motion`, **never re-export it through a barrel** (Turbopack hangs traversing the graph). Transitions are short eases (0.12–0.22s); hover lift is `translateY(-1px)` buttons, `-2px` cards. `prefers-reduced-motion` is globally honored — don't add per-component opt-outs.

## Do / Don't

- ✅ Tokens (`var(--ink)`) or shared classes; serif for display, mono for labels; hairline `1px solid var(--line)` separators; hard offset shadows.
- ✅ French UI text (labels, defaults, errors).
- ❌ Gradients, blurred/soft drop shadows, rounded-xl+, dark-mode variants, new font imports, raw hex/oklch literals in components, Tailwind palette colors (`bg-blue-500`).
- ❌ Per-file restyling of shadcn primitives — change the `data-slot` override instead.
- ⚠️ CV **templates** (`src/components/templates/`) are user-themed documents — they read `resume.style` (user-picked color/font), not app tokens. App chrome around them still uses this system.
