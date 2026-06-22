// Shared translation resolver — used by both the server (getDictionary) and the
// client (LanguageProvider). Dictionaries are plain nested objects of strings;
// `t` resolves a dotted key path and interpolates `{var}` placeholders.

export type Dictionary = { [key: string]: string | Dictionary };

export type TranslateVars = Record<string, string | number>;

export type TranslateFn = (key: string, vars?: TranslateVars) => string;

function resolve(dict: Dictionary, key: string): string | undefined {
  const value = key
    .split(".")
    .reduce<
      string | Dictionary | undefined
    >((acc, part) => (acc && typeof acc === "object" ? acc[part] : undefined), dict);
  return typeof value === "string" ? value : undefined;
}

function interpolate(template: string, vars?: TranslateVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

/**
 * Build a `t(key, vars?)` function bound to a dictionary. Missing keys return
 * the key itself (and warn in dev) so a forgotten translation is visible rather
 * than silently blank.
 */
export function makeT(dict: Dictionary): TranslateFn {
  return (key, vars) => {
    const template = resolve(dict, key);
    if (template === undefined) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[i18n] missing translation key: ${key}`);
      }
      return key;
    }
    return interpolate(template, vars);
  };
}
