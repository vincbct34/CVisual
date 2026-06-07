"use client";

import { useState, useCallback, useRef, useSyncExternalStore } from "react";
import { callAI, streamAI, stripCodeFence } from "@/lib/ai/ai-client";
import {
  improveContentPrompt,
  generateSummaryPrompt,
  generateCoverLetterPrompt,
} from "@/lib/ai/prompts";
import {
  AIError,
  LOCALSTORAGE_KEY,
  LOCALSTORAGE_MODEL,
  LOCALSTORAGE_PROVIDER,
  LEGACY_CVMAKER_KEY,
  LEGACY_CVMAKER_MODEL,
  LEGACY_CVMAKER_PROVIDER,
  LEGACY_OPENAI_KEY,
  LEGACY_OPENAI_MODEL,
  DEFAULT_PROVIDER,
  PROVIDER_MODELS,
} from "@/lib/ai/types";
import type { AIModel, AIProvider } from "@/lib/ai/types";

// Migrate legacy localStorage keys on first load
function migrateLegacyKeys() {
  if (typeof window === "undefined") return;

  // cvmaker_* → cvisual_* (project rename). Preserves an existing key/model/provider.
  const renamed: [string, string][] = [
    [LEGACY_CVMAKER_KEY, LOCALSTORAGE_KEY],
    [LEGACY_CVMAKER_MODEL, LOCALSTORAGE_MODEL],
    [LEGACY_CVMAKER_PROVIDER, LOCALSTORAGE_PROVIDER],
  ];
  for (const [from, to] of renamed) {
    const value = localStorage.getItem(from);
    if (value && !localStorage.getItem(to)) localStorage.setItem(to, value);
    if (value) localStorage.removeItem(from);
  }

  const legacyKey = localStorage.getItem(LEGACY_OPENAI_KEY);
  if (legacyKey && !localStorage.getItem(LOCALSTORAGE_KEY)) {
    localStorage.setItem(LOCALSTORAGE_KEY, legacyKey);
    localStorage.setItem(LOCALSTORAGE_PROVIDER, "openai");
    localStorage.removeItem(LEGACY_OPENAI_KEY);
  }
  const legacyModel = localStorage.getItem(LEGACY_OPENAI_MODEL);
  if (legacyModel && !localStorage.getItem(LOCALSTORAGE_MODEL)) {
    localStorage.setItem(LOCALSTORAGE_MODEL, legacyModel);
    localStorage.removeItem(LEGACY_OPENAI_MODEL);
  }
}

let migrated = false;

// External store for localStorage — allows reactive updates across components
function subscribe(callback: () => void) {
  if (!migrated) {
    migrateLegacyKeys();
    migrated = true;
  }
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getApiKeySnapshot() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LOCALSTORAGE_KEY);
}

function getProviderSnapshot(): AIProvider {
  if (typeof window === "undefined") return DEFAULT_PROVIDER;
  return (
    (localStorage.getItem(LOCALSTORAGE_PROVIDER) as AIProvider) ||
    DEFAULT_PROVIDER
  );
}

function getServerSnapshot() {
  return null;
}

function getServerProviderSnapshot(): AIProvider {
  return DEFAULT_PROVIDER;
}

export function useAI() {
  const apiKey = useSyncExternalStore(
    subscribe,
    getApiKeySnapshot,
    getServerSnapshot,
  );
  const provider = useSyncExternalStore(
    subscribe,
    getProviderSnapshot,
    getServerProviderSnapshot,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const hasKey = !!apiKey;

  function setApiKey(key: string) {
    localStorage.setItem(LOCALSTORAGE_KEY, key);
    window.dispatchEvent(
      new StorageEvent("storage", { key: LOCALSTORAGE_KEY }),
    );
  }

  function removeApiKey() {
    localStorage.removeItem(LOCALSTORAGE_KEY);
    window.dispatchEvent(
      new StorageEvent("storage", { key: LOCALSTORAGE_KEY }),
    );
  }

  function setProvider(p: AIProvider) {
    localStorage.setItem(LOCALSTORAGE_PROVIDER, p);
    // Remove key when switching provider (different key format)
    localStorage.removeItem(LOCALSTORAGE_KEY);
    window.dispatchEvent(
      new StorageEvent("storage", { key: LOCALSTORAGE_PROVIDER }),
    );
  }

  function requireKey(): string {
    const providerName =
      provider === "gemini"
        ? "Google Gemini"
        : provider === "anthropic"
          ? "Anthropic Claude"
          : "OpenAI";
    if (!apiKey) {
      throw new AIError(
        `Veuillez configurer votre clé API ${providerName}`,
        "no_key",
      );
    }
    return apiKey;
  }

  /** Get the powerful model for the current provider */
  function getPowerfulModel(): AIModel {
    return PROVIDER_MODELS[provider].powerful;
  }

  /** Get the fast model for the current provider */
  function getFastModel(): AIModel {
    return PROVIDER_MODELS[provider].fast;
  }

  /**
   * Improve existing text content (non-streaming).
   */
  const improve = useCallback(
    async (
      content: string,
      context?: string,
      instruction?: string,
    ): Promise<string> => {
      const key = requireKey();
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoading(true);
      setError(null);
      try {
        const messages = improveContentPrompt(content, context, instruction);
        const result = await callAI(provider, {
          apiKey: key,
          messages,
          model: getFastModel(),
          signal: controller.signal,
        });
        return stripCodeFence(result);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") throw err;
        const msg = err instanceof AIError ? err.message : "Erreur inattendue";
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiKey, provider],
  );

  /**
   * Generate a professional summary from CV data.
   */
  const generateSummary = useCallback(
    async (resumeData: {
      jobTitle: string;
      experiences: string;
      skills: string;
      education: string;
      language: string;
    }): Promise<string> => {
      const key = requireKey();
      setIsLoading(true);
      setError(null);
      try {
        const messages = generateSummaryPrompt(resumeData);
        const result = await callAI(provider, {
          apiKey: key,
          messages,
          model: getPowerfulModel(),
        });
        return stripCodeFence(result);
      } catch (err) {
        const msg = err instanceof AIError ? err.message : "Erreur inattendue";
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiKey, provider],
  );

  /**
   * Generate a cover letter (streaming).
   */
  const generateCoverLetter = useCallback(
    async (
      resumeData: Parameters<typeof generateCoverLetterPrompt>[0],
      onChunk?: (text: string) => void,
    ): Promise<string> => {
      const key = requireKey();
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoading(true);
      setError(null);
      try {
        const messages = generateCoverLetterPrompt(resumeData);
        let full = "";
        for await (const chunk of streamAI(provider, {
          apiKey: key,
          messages,
          model: getPowerfulModel(),
          signal: controller.signal,
        })) {
          full += chunk;
          onChunk?.(stripCodeFence(full));
        }
        return stripCodeFence(full);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") throw err;
        const msg = err instanceof AIError ? err.message : "Erreur inattendue";
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiKey, provider],
  );

  const generate = useCallback(
    async (
      messages: Parameters<typeof callAI>[1]["messages"],
    ): Promise<string> => {
      const key = requireKey();
      setIsLoading(true);
      setError(null);
      try {
        return await callAI(provider, {
          apiKey: key,
          messages,
          model: getFastModel(),
        });
      } catch (err) {
        const msg = err instanceof AIError ? err.message : "Erreur inattendue";
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiKey, provider],
  );

  function cancelAI() {
    abortRef.current?.abort();
  }

  const isConfigured = hasKey;

  return {
    apiKey,
    provider,
    hasKey,
    isConfigured,
    setApiKey,
    removeApiKey,
    setProvider,
    improve,
    generate,
    generateSummary,
    generateCoverLetter,
    cancelAI,
    isLoading,
    error,
  };
}
