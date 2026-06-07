import { AIError, type AIModel, type ChatMessage } from "./types";

export interface CallOptions {
  apiKey: string;
  messages: ChatMessage[];
  model: AIModel;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

/**
 * Per-provider differences, plugged into the shared fetch/SSE engine below.
 * Every provider speaks the same OpenAI-style `data: ` SSE framing; only the
 * URL, headers, request body and the JSON shapes differ.
 */
export interface ProviderAdapter {
  /** Human name used in error messages, e.g. "OpenAI". */
  label: string;
  /** Cheap model used to probe whether an API key is valid. */
  validateModel: AIModel;
  /** HTTP statuses that mean "bad key" (defaults to [401]). */
  invalidKeyStatuses?: number[];
  /** Build the request for a streaming or non-streaming call. */
  request(
    opts: Required<Pick<CallOptions, "temperature">> & CallOptions,
    stream: boolean,
  ): {
    url: string;
    init: RequestInit;
  };
  /** Extract the full text from a non-streaming JSON response. */
  parseResponse(data: unknown): string;
  /** Extract the incremental text from one streamed JSON chunk. */
  parseChunk(data: unknown): string | undefined;
  /** Raw post-`data: ` payload that ends the stream without being JSON (e.g. "[DONE]"). */
  streamDoneSentinel?: string;
  /** JSON-level end-of-stream signal (e.g. Anthropic's `message_stop`). */
  isDone?(data: unknown): boolean;
}

const DEFAULT_TEMPERATURE = 0.7;

function withDefaults(opts: CallOptions) {
  return { ...opts, temperature: opts.temperature ?? DEFAULT_TEMPERATURE };
}

async function doFetch(
  adapter: ProviderAdapter,
  opts: CallOptions,
  stream: boolean,
): Promise<Response> {
  const { url, init } = adapter.request(withDefaults(opts), stream);
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: opts.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new AIError(
      `Impossible de contacter l'API ${adapter.label}`,
      "network_error",
    );
  }
  if (!res.ok) {
    const invalidKey = adapter.invalidKeyStatuses ?? [401];
    if (invalidKey.includes(res.status)) {
      throw new AIError("Clé API invalide", "invalid_key");
    }
    if (res.status === 429) {
      throw new AIError(
        "Limite de requêtes atteinte, réessayez dans quelques secondes",
        "rate_limit",
      );
    }
    throw new AIError(
      `Erreur ${adapter.label} (${res.status})`,
      "server_error",
    );
  }
  return res;
}

/** Non-streaming call. Returns the full response text. */
export async function callProvider(
  adapter: ProviderAdapter,
  opts: CallOptions,
): Promise<string> {
  const res = await doFetch(adapter, opts, false);
  return adapter.parseResponse(await res.json());
}

/** Streaming call. Yields text chunks as they arrive. */
export async function* streamProvider(
  adapter: ProviderAdapter,
  opts: CallOptions,
): AsyncGenerator<string> {
  const res = await doFetch(adapter, opts, true);
  const reader = res.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;
      const payload = trimmed.slice(6);
      if (
        adapter.streamDoneSentinel &&
        payload === adapter.streamDoneSentinel
      ) {
        return;
      }
      let json: unknown;
      try {
        json = JSON.parse(payload);
      } catch {
        continue; // skip malformed/partial chunks
      }
      if (adapter.isDone?.(json)) return;
      const text = adapter.parseChunk(json);
      if (text) yield text;
    }
  }
}

/** Probe a key with a 1-token request. Returns false only on an invalid key. */
export async function validateProviderKey(
  adapter: ProviderAdapter,
  apiKey: string,
): Promise<boolean> {
  try {
    await callProvider(adapter, {
      apiKey,
      messages: [{ role: "user", content: "Hi" }],
      model: adapter.validateModel,
      maxTokens: 1,
    });
    return true;
  } catch (err) {
    if (err instanceof AIError && err.code === "invalid_key") return false;
    throw err;
  }
}
