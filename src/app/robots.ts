import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Only the marketing/auth surface is crawlable. Everything behind auth, plus the
// token-bearing render/share routes and the API, is disallowed so personal CVs
// and signed URLs never land in a search index. Routes (except /api and /render)
// are locale-prefixed, so disallow both the bare and the /*/ -prefixed forms.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/render/",
        "/*/dashboard",
        "/*/editor/",
        "/*/cover-letter/",
        "/*/share/",
        "/*/public/",
        "/*/settings/",
      ],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
