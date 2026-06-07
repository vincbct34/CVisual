# AI Integration

Client-side only. API keys stored in `localStorage`, never persisted on CVisual's
server. OpenAI and Gemini are called **directly from the browser**; Anthropic is
called through a thin same-origin proxy (`/api/anthropic`) because Anthropic's API
blocks browser CORS — the key still travels per-request from the browser and is
never stored server-side.

## Provider Abstraction (`src/lib/ai/`)

```
ai-client.ts     — public dispatcher: callAI / streamAI / validateKey / stripCodeFence
provider-core.ts — shared engine (doFetch + callProvider / streamProvider / validateProviderKey) over a ProviderAdapter
providers.ts     — PROVIDER_ADAPTERS: per-provider request/parse adapters (openai, gemini, anthropic)
types.ts         — AIProvider, AIModel, ChatMessage, AIError, PROVIDER_MODELS, localStorage keys
prompts.ts       — prompt factories (see below)
json.ts          — parseJsonResponse: tolerant JSON extractor for AI replies
translate.ts     — CV translation orchestration
```

`ai-client.ts` keeps a stable public API (`callAI`, `streamAI`, `validateKey`)
and delegates to `PROVIDER_ADAPTERS[provider]`. Each adapter declares how to build
the request and parse responses/stream chunks for its provider; the engine in
`provider-core.ts` owns fetch, SSE framing, and error mapping.

**Providers:** `"openai"` | `"gemini"` | `"anthropic"`

**Models** (`PROVIDER_MODELS` in `types.ts`):
| Provider | Fast | Powerful |
| --------- | ----------------------- | ------------------------- |
| openai | gpt-4o-mini | gpt-4o |
| gemini | gemini-2.5-flash | gemini-2.5-pro |
| anthropic | claude-3-5-haiku-latest | claude-3-5-sonnet-latest |

Default: `gemini` / `gemini-2.5-flash` (`DEFAULT_PROVIDER` / `DEFAULT_MODEL`).

## localStorage Keys

```
cvisual_api_key      — current provider's API key
cvisual_ai_model     — selected model
cvisual_ai_provider  — "openai" | "gemini" | "anthropic"

# Legacy (migrated to cvisual_* on read, then removed):
cvmaker_api_key / cvmaker_ai_model / cvmaker_ai_provider   # pre-rename (CVMaker → CVisual)
cvmaker_openai_key / cvmaker_openai_model                  # original OpenAI-only release
```

## Prompt Factories (`src/lib/ai/prompts.ts`)

All return `ChatMessage[]` (system + user messages). Language-aware (prompts in
French, output in the resume's `language`).

| Function                                                | Purpose                        | Output format         |
| ------------------------------------------------------- | ------------------------------ | --------------------- |
| `improveContentPrompt(content, context?, instruction?)` | Improve / rewrite section text | HTML (preserves tags) |
| `generateSummaryPrompt(resumeData)`                     | Generate profile summary       | HTML `<p>`            |
| `translateContentPrompt(json, from, to)`                | Translate section content      | JSON (same shape)     |
| `atsScorePrompt(resumeData)`                            | Score CV vs a job description  | JSON (score + advice) |
| `linkedinImportPrompt(text)`                            | Structure raw LinkedIn text    | JSON (sections)       |
| `generateCoverLetterPrompt(resumeData)`                 | Generate cover letter body     | HTML `<p>` tags       |

JSON-returning prompts are parsed via `parseJsonResponse` (`json.ts`), which strips
code fences / prose around the JSON before `JSON.parse`.

## `useAI` Hook (`src/hooks/use-ai.ts`)

Manages provider, model, and apiKey (from localStorage) plus streaming state.
Exposes higher-level actions used by the AI buttons — `improve`, `generateSummary`,
`generateCoverLetter`, plus low-level `generate(messages)` / `stream(messages, onChunk)`,
and `hasKey` / `isConfigured` flags.

## UI Components (`src/components/ai/`)

| Component                        | Purpose                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------- |
| `ai-settings-dialog.tsx`         | Configure provider, model, API key — saves to localStorage; tests the key via `validateKey`  |
| `ai-improve-button.tsx`          | Inline "IA" button on rich-text fields — presets + custom instruction, streams improved HTML |
| `ai-generate-summary-button.tsx` | Generate profile summary from CV data                                                        |
| `ai-cover-letter-dialog.tsx`     | Dialog: pick a CV + paste job description → full cover letter                                |
| `ai-ats-score-button.tsx`        | Score the CV against a job description (returns JSON advice)                                 |
| `ai-linkedin-import-dialog.tsx`  | Paste LinkedIn text → structured sections                                                    |
| `ai-setup-banner.tsx`            | Banner shown when no key is configured                                                       |
| `ai-shared.tsx`                  | Shared `SparklesIcon` + `notifyAINotConfigured` toast helper                                 |

## Translation Flow (`src/lib/ai/translate.ts`)

1. Collect all section `content` objects.
2. Serialize to JSON.
3. Call `translateContentPrompt` → AI returns translated JSON (per-section, with retry/failure tracking).
4. Parse + merge back into sections.
5. The card flow creates the linked Resume via `POST /api/cv/[id]/duplicate` (with a target `language`, which sets `parentId`), then PUTs the translated sections back.

## Error Handling

`AIError` class with codes: `invalid_key | rate_limit | server_error | network_error | no_key`. UI shows a toast on error; a `no_key` error routes the user to the settings dialog.
