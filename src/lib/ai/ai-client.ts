import type { AIProvider } from "./types";
import {
  callProvider,
  streamProvider,
  validateProviderKey,
  type CallOptions,
} from "./provider-core";
import { PROVIDER_ADAPTERS } from "./providers";

export type { CallOptions };

/**
 * Strip a leading/trailing markdown code fence (```html, ```json, ...) that
 * models often wrap output in despite being told not to. Safe to call on
 * partial (streaming) text — a not-yet-closed fence just has its opener removed.
 */
export function stripCodeFence(text: string): string {
  return text.replace(/^\s*```[a-zA-Z]*\s*\n?/, "").replace(/\n?```\s*$/, "");
}

export function callAI(
  provider: AIProvider,
  options: CallOptions,
): Promise<string> {
  return callProvider(PROVIDER_ADAPTERS[provider], options);
}

export function streamAI(
  provider: AIProvider,
  options: CallOptions,
): AsyncGenerator<string> {
  return streamProvider(PROVIDER_ADAPTERS[provider], options);
}

export function validateKey(
  provider: AIProvider,
  apiKey: string,
): Promise<boolean> {
  return validateProviderKey(PROVIDER_ADAPTERS[provider], apiKey);
}
