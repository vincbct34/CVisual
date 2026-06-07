# Editor Architecture

Two editors: Resume editor (`/editor/[id]`) and Cover Letter editor (`/cover-letter/[id]`). Both are client components holding full state in React, auto-saved on debounce, with a resizable editor/preview split.

## Shared Editor Hooks

| Hook                                     | Role                                                                                                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `useDebouncedAutosave(save, delay=1000)` | Debounces `save` to **1000ms** after the last change; exposes `isSaving` and `schedule(value)`. The `save` callback owns its own error toasts.                     |
| `useResizablePanels(storagePrefix)`      | Split-pane width drag + preview collapse, persisted to `localStorage` under `<prefix>_left_width` / `<prefix>_preview_collapsed` (`cvisual_editor`, `cvisual_cl`). |

## Resume Editor (`src/app/editor/[id]/page.tsx`)

### State

```ts
resume: Resume | null; // full resume with sections[]
// isSaving comes from useDebouncedAutosave; panel state from useResizablePanels
```

### Auto-save

Any change calls `autoSave(updatedResume)` (the `schedule` from `useDebouncedAutosave`).
After the 1000ms debounce it PUTs `/api/cv/[id]` (title/template/style/language)
then PUTs each section; per-section failures are toast-reported. No optimistic UI —
`isSaving` clears when the save settles. Reorder is persisted separately (not debounced).

### Layout

A left editor pane (tabs) + a resizable, collapsible right **preview** pane
(`ResumePreview`), with a draggable divider. The editor pane has two tabs:

| Tab      | Content                                                                   |
| -------- | ------------------------------------------------------------------------- |
| Sections | Completeness bar, add-section picker, profile (fixed) + sortable sections |
| Style    | Template picker + `StylePanel` (color, font, sizes, photo, sidebar)       |

Toolbar: title input, save status, preview toggle, **Share** dialog (public toggle + share link), **ATS score** button, and an **Export** menu (PDF / DOCX / HTML / JSON).

### Section Drag-and-Drop

`dnd-kit` (`DndContext` + `SortableContext`); each draggable section wrapped in
`SortableSection` (profile stays pinned at order 0). On `DragEndEvent`: reorder
local state → `PUT /api/cv/[id]/sections/reorder`, with rollback on failure.

### Components

| Component              | Path                                | Role                                                      |
| ---------------------- | ----------------------------------- | --------------------------------------------------------- |
| `SortableSection`      | `editor/sortable-section.tsx`       | DnD wrapper, visibility toggle, delete                    |
| `SectionForm`          | `editor/section-forms.tsx`          | Form fields per section type                              |
| `StylePanel`           | `editor/style-panel.tsx`            | Template + style controls (built on `style-controls.tsx`) |
| `ResumePreview`        | `editor/resume-preview.tsx`         | Renders the chosen template in a scaled preview           |
| `TemplatePreviewModal` | `editor/template-preview-modal.tsx` | Compare/select templates                                  |

### Shared Style Controls (`src/components/editor/style-controls.tsx`)

Generic primitives reused by both the resume and cover-letter style panels:
`ColorPresetPicker`, `FontSelect`, `FontSizeControls`, `SliderField`,
`OptionButtons`. Each panel keeps its own FONTS / COLOR_PRESETS arrays.

### Rich Text (`src/components/editor/rich-text-editor.tsx`)

Tiptap 3 (`StarterKit` + `Placeholder`) for `description` fields
(experience/education/projects), profile `summary`, custom sections, and the cover
letter body. Output: HTML stored in `content`. AI buttons (`AIImproveButton`,
`AIGenerateSummaryButton`) render inline next to editors.

## Cover Letter Editor (`src/app/cover-letter/[id]/page.tsx`)

Same hooks + split-pane pattern. Tabs: **Contenu** (sender, recipient, date,
Tiptap body, signature via `SignaturePad` / upload) and **Style**
(`CoverLetterStylePanel`). Preview uses `PagedPreview` wrapping
`CoverLetterTemplate`. Autosave PUTs `/api/cover-letters/[id]`.

> AI cover-letter generation (`AIGenerateCoverLetterDialog`, pick a CV + paste a
> job description) is launched from the **dashboard** (`src/app/dashboard/page.tsx`),
> not from this editor.

## Section Forms (`src/components/editor/section-forms.tsx`)

A `SectionForm` dispatcher switches on `section.type`:

- `profile`: photo upload (downscaled) + plain inputs + custom contact fields + Tiptap summary
- `experience` / `education` / `projects` / `certifications` / `interests` / `languages`: a generic `ListForm<T>` of items
- `skills`: `ListForm` + a display selector (dots/bar/tags/text)
- `custom`: mode selector → Tiptap text **or** a skills-style list

Shared parts: `ItemHeader` (title + remove) and `RowDeleteButton`. Item mutation
updates local `content.items[]` → debounced section PUT.

## Key Patterns

- `authFetch` for all API calls (transparent token refresh).
- Toast (`sonner`) for error/success feedback.
- No form library — controlled React state throughout.
- Section visibility toggled in `SortableSection` → section PUT `{ visible }`.
- File downloads go through `triggerBlobDownload` (`lib/utils.ts`).
