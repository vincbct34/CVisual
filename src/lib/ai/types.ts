export type AIProvider = "openai" | "gemini" | "anthropic";

export type AIModel =
  | "gpt-4o"
  | "gpt-4o-mini"
  | "gemini-2.5-flash"
  | "gemini-2.5-pro"
  | "claude-3-5-haiku-latest"
  | "claude-3-5-sonnet-latest";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export class AIError extends Error {
  code:
    | "invalid_key"
    | "rate_limit"
    | "server_error"
    | "network_error"
    | "no_key";

  constructor(message: string, code: AIError["code"]) {
    super(message);
    this.name = "AIError";
    this.code = code;
  }
}

export const LOCALSTORAGE_KEY = "cvisual_api_key";
export const LOCALSTORAGE_MODEL = "cvisual_ai_model";
export const LOCALSTORAGE_PROVIDER = "cvisual_ai_provider";

// Legacy keys, migrated to the cvisual_* keys on first load then removed.
// cvmaker_* — pre-rename (CVMaker → CVisual):
export const LEGACY_CVMAKER_KEY = "cvmaker_api_key";
export const LEGACY_CVMAKER_MODEL = "cvmaker_ai_model";
export const LEGACY_CVMAKER_PROVIDER = "cvmaker_ai_provider";
// cvmaker_openai_* — original OpenAI-only release:
export const LEGACY_OPENAI_KEY = "cvmaker_openai_key";
export const LEGACY_OPENAI_MODEL = "cvmaker_openai_model";

export const DEFAULT_PROVIDER: AIProvider = "gemini";

export const PROVIDER_MODELS: Record<
  AIProvider,
  { fast: AIModel; powerful: AIModel }
> = {
  openai: { fast: "gpt-4o-mini", powerful: "gpt-4o" },
  gemini: { fast: "gemini-2.5-flash", powerful: "gemini-2.5-pro" },
  anthropic: {
    fast: "claude-3-5-haiku-latest",
    powerful: "claude-3-5-sonnet-latest",
  },
};
