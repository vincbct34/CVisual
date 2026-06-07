import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Only the marketing/auth surface is crawlable. Everything behind auth, plus the
// token-bearing render/share routes and the API, is disallowed so personal CVs
// and signed URLs never land in a search index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard",
        "/editor/",
        "/cover-letter/",
        "/render/",
        "/share/",
        "/public/",
        "/settings/",
      ],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
