// i18n configuration — single source of truth for supported locales.
// URL routing lives under app/[lang]/… and the proxy redirects bare paths to a
// locale-prefixed one. Adding a locale here + a dictionary file is all that is
// needed to extend language support.

export const locales = ["fr", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fr";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

// Human labels for the language switcher.
export const localeNames: Record<Locale, string> = {
  fr: "Français",
  en: "English",
};

/**
 * Prefix an app-internal path with a locale. External URLs, anchors, mailto and
 * already-localized paths are returned untouched. Server-safe (no "use client").
 */
export function withLocale(href: string, locale: Locale): string {
  if (!href.startsWith("/")) return href;
  const firstSegment = href.split("/")[1];
  if (isLocale(firstSegment)) return href;
  return `/${locale}${href === "/" ? "" : href}`;
}

/** Strip a leading locale segment from a pathname. */
export function stripLocale(pathname: string): string {
  const segments = pathname.split("/");
  if (isLocale(segments[1])) {
    const rest = "/" + segments.slice(2).join("/");
    return rest === "/" ? "/" : rest.replace(/\/$/, "");
  }
  return pathname;
}
