import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Public, non-personal routes only. Authed and token-bearing pages are excluded
// (see robots.ts). Each path is emitted once per locale with hreflang
// alternates so search engines index both /fr and /en.
const PATHS: {
  path: string;
  changeFrequency: "monthly" | "yearly";
  priority: number;
}[] = [
  { path: "", changeFrequency: "monthly", priority: 1 },
  { path: "/modeles", changeFrequency: "monthly", priority: 0.7 },
  { path: "/ia", changeFrequency: "monthly", priority: 0.7 },
  { path: "/export", changeFrequency: "monthly", priority: 0.7 },
  { path: "/login", changeFrequency: "yearly", priority: 0.5 },
  { path: "/register", changeFrequency: "yearly", priority: 0.5 },
  { path: "/mentions-legales", changeFrequency: "yearly", priority: 0.2 },
  { path: "/confidentialite", changeFrequency: "yearly", priority: 0.2 },
  { path: "/cgu", changeFrequency: "yearly", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return PATHS.flatMap(({ path, changeFrequency, priority }) =>
    locales.map((locale) => ({
      url: `${APP_URL}/${locale}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${APP_URL}/${l}${path}`]),
        ),
      },
    })),
  );
}
