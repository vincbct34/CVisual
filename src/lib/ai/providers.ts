import type { AIProvider, ChatMessage } from "./types";
import type { ProviderAdapter } from "./provider-core";

const json = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

// ── OpenAI (browser → api.openai.com) ──────────────────────────────
const openai: ProviderAdapter = {
  label: "OpenAI",
  validateModel: "gpt-4o-mini",
  request({ apiKey, messages, model, temperature, maxTokens }, stream) {
    const init = json({
      model,
      messages,
      temperature,
      ...(maxTokens ? { max_tokens: maxTokens } : {}),
      ...(stream ? { stream: true } : {}),
    });
    init.headers = {
      ...(init.headers as Record<string, string>),
      Authorization: `Bearer ${apiKey}`,
    };
    return { url: "https://api.openai.com/v1/chat/completions", init };
  },
  parseResponse: (d) =>
    (d as { choices?: { message?: { content?: string } }[] }).choices?.[0]
      ?.message?.content ?? "",
  parseChunk: (d) =>
    (d as { choices?: { delta?: { content?: string } }[] }).choices?.[0]?.delta
      ?.content,
  streamDoneSentinel: "[DONE]",
};

// ── Gemini (browser → generativelanguage.googleapis.com) ───────────
function toGeminiBody(
  messages: ChatMessage[],
  temperature: number,
  maxTokens?: number,
) {
  const system = messages.find((m) => m.role === "system");
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
  return {
    ...(system
      ? { systemInstruction: { parts: [{ text: system.content }] } }
      : {}),
    contents,
    generationConfig: {
      temperature,
      ...(maxTokens ? { maxOutputTokens: maxTokens } : {}),
    },
  };
}

const geminiText = (d: unknown) =>
  (
    d as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    }
  ).candidates?.[0]?.content?.parts?.[0]?.text;

const gemini: ProviderAdapter = {
  label: "Gemini",
  validateModel: "gemini-2.5-flash",
  invalidKeyStatuses: [400, 403],
  request({ apiKey, messages, model, temperature, maxTokens }, stream) {
    const base = `https://generativelanguage.googleapis.com/v1beta/models/${model}`;
    const url = stream
      ? `${base}:streamGenerateContent?alt=sse&key=${apiKey}`
      : `${base}:generateContent?key=${apiKey}`;
    return { url, init: json(toGeminiBody(messages, temperature, maxTokens)) };
  },
  parseResponse: (d) => geminiText(d) ?? "",
  parseChunk: geminiText,
};

// ── Anthropic (browser → our /api/anthropic proxy) ─────────────────
const anthropic: ProviderAdapter = {
  label: "Anthropic",
  validateModel: "claude-3-5-haiku-latest",
  request({ apiKey, messages, model, temperature, maxTokens }, stream) {
    const system = messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n");
    const init = json({
      model,
      messages: messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content })),
      ...(system ? { system } : {}),
      temperature,
      max_tokens: maxTokens ?? 4096,
      ...(stream ? { stream: true } : {}),
    });
    init.headers = {
      ...(init.headers as Record<string, string>),
      "x-api-key": apiKey,
    };
    return { url: "/api/anthropic", init };
  },
  parseResponse: (d) =>
    (d as { content?: { text?: string }[] }).content?.[0]?.text ?? "",
  parseChunk: (d) => {
    const c = d as { type?: string; delta?: { text?: string } };
    return c.type === "content_block_delta" ? c.delta?.text : undefined;
  },
  isDone: (d) => (d as { type?: string }).type === "message_stop",
};

export const PROVIDER_ADAPTERS: Record<AIProvider, ProviderAdapter> = {
  openai,
  gemini,
  anthropic,
};
