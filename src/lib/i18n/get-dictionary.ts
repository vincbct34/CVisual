import "server-only";
import type { Locale } from "./config";
import type { Dictionary } from "./translate";

// Dynamic imports so each locale's dictionary is code-split; only the active
// locale's strings are loaded (and forwarded to the client provider).
const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  fr: () => import("./dictionaries/fr").then((m) => m.fr as Dictionary),
  en: () => import("./dictionaries/en").then((m) => m.en as Dictionary),
};

export const getDictionary = (locale: Locale): Promise<Dictionary> =>
  dictionaries[locale]();
