"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import type { Locale } from "@/lib/i18n/config";
import { makeT, type Dictionary, type TranslateFn } from "@/lib/i18n/translate";

interface LanguageContextValue {
  locale: Locale;
  t: TranslateFn;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/**
 * Provides the active locale + a `t()` translator to client components. The
 * server [lang] layout loads the dictionary for the active locale and passes it
 * here, so only one locale's strings ship to the browser. Also keeps a
 * `locale` cookie + the <html lang> attribute in sync with the URL segment.
 */
export function LanguageProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: ReactNode;
}) {
  const t = useMemo(() => makeT(dict), [dict]);

  useEffect(() => {
    document.documentElement.lang = locale;
    // Persist the choice so the proxy can honour it on bare-path visits.
    document.cookie = `locale=${locale}; path=/; max-age=31536000; samesite=lax`;
  }, [locale]);

  const value = useMemo<LanguageContextValue>(
    () => ({ locale, t }),
    [locale, t],
  );

  return <LanguageContext value={value}>{children}</LanguageContext>;
}

function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}

export function useT(): TranslateFn {
  return useLanguage().t;
}

export function useLocale(): Locale {
  return useLanguage().locale;
}
