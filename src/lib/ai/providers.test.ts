import { describe, it, expect } from "vitest";
import { PROVIDER_ADAPTERS } from "./providers";
import type { ChatMessage } from "./types";

const messages: ChatMessage[] = [
  { role: "system", content: "sys" },
  { role: "user", content: "hello" },
  { role: "assistant", content: "hi" },
];

const baseOpts = {
  apiKey: "KEY",
  messages,
  model: "test-model" as never,
  temperature: 0.7,
};

function bodyOf(init: RequestInit): Record<string, unknown> {
  return JSON.parse(init.body as string);
}

describe("openai adapter", () => {
  const a = PROVIDER_ADAPTERS.openai;

  it("targets the chat completions endpoint with bearer auth", () => {
    const { url, init } = a.request(baseOpts, false);
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer KEY",
    );
  });

  it("sets stream flag only when streaming", () => {
    expect(bodyOf(a.request(baseOpts, false).init).stream).toBeUndefined();
    expect(bodyOf(a.request(baseOpts, true).init).stream).toBe(true);
  });

  it("passes messages through unchanged and forwards max_tokens", () => {
    const body = bodyOf(a.request({ ...baseOpts, maxTokens: 100 }, false).init);
    expect(body.messages).toEqual(messages);
    expect(body.max_tokens).toBe(100);
  });

  it("parses response and stream chunks", () => {
    expect(
      a.parseResponse({ choices: [{ message: { content: "out" } }] }),
    ).toBe("out");
    expect(a.parseResponse({})).toBe("");
    expect(a.parseChunk({ choices: [{ delta: { content: "x" } }] })).toBe("x");
  });
});

describe("gemini adapter", () => {
  const a = PROVIDER_ADAPTERS.gemini;

  it("uses the SSE streaming URL when streaming, key in query", () => {
    expect(a.request(baseOpts, false).url).toContain(
      ":generateContent?key=KEY",
    );
    const streamUrl = a.request(baseOpts, true).url;
    expect(streamUrl).toContain(":streamGenerateContent?alt=sse&key=KEY");
  });

  it("hoists system message into systemInstruction and remaps roles", () => {
    const body = bodyOf(a.request(baseOpts, false).init) as {
      systemInstruction: { parts: { text: string }[] };
      contents: { role: string }[];
    };
    expect(body.systemInstruction.parts[0].text).toBe("sys");
    expect(body.contents.map((c) => c.role)).toEqual(["user", "model"]);
  });

  it("treats 400/403 as invalid-key statuses", () => {
    expect(a.invalidKeyStatuses).toEqual([400, 403]);
  });

  it("parses candidate text for response and chunk", () => {
    const d = { candidates: [{ content: { parts: [{ text: "g" }] } }] };
    expect(a.parseResponse(d)).toBe("g");
    expect(a.parseChunk(d)).toBe("g");
  });
});

describe("anthropic adapter", () => {
  const a = PROVIDER_ADAPTERS.anthropic;

  it("routes through the proxy with x-api-key header", () => {
    const { url, init } = a.request(baseOpts, false);
    expect(url).toBe("/api/anthropic");
    expect((init.headers as Record<string, string>)["x-api-key"]).toBe("KEY");
  });

  it("joins system messages and strips them from messages[]", () => {
    const body = bodyOf(a.request(baseOpts, false).init) as {
      system: string;
      messages: ChatMessage[];
      max_tokens: number;
    };
    expect(body.system).toBe("sys");
    expect(body.messages).toEqual([
      { role: "user", content: "hello" },
      { role: "assistant", content: "hi" },
    ]);
    expect(body.max_tokens).toBe(4096); // default when unset
  });

  it("detects content_block_delta chunks and message_stop terminator", () => {
    expect(
      a.parseChunk({ type: "content_block_delta", delta: { text: "z" } }),
    ).toBe("z");
    expect(a.parseChunk({ type: "message_start" })).toBeUndefined();
    expect(a.isDone?.({ type: "message_stop" })).toBe(true);
    expect(a.isDone?.({ type: "content_block_delta" })).toBe(false);
  });
});
