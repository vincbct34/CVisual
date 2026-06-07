import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const isDev = process.env.NODE_ENV === "development";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  disable: isDev,
});

const nextConfig: NextConfig = {
  // Allow Turbopack in dev (serwist adds webpack config for prod builds)
  turbopack: {},
  // Keep the headless-browser stack out of the bundle: it must be require()'d
  // from node_modules at runtime (native binary + large Chromium build), not
  // traced/bundled by webpack. puppeteer is dev-only (local exports); the
  // serverless path uses puppeteer-core + @sparticuz/chromium.
  serverExternalPackages: [
    "puppeteer",
    "puppeteer-core",
    "@sparticuz/chromium",
  ],
  // `puppeteer` is dev-only (local export path). Never trace it into the
  // serverless bundle — the runtime guard always picks puppeteer-core +
  // @sparticuz/chromium on Vercel, so the heavy package must not ship.
  outputFileTracingExcludes: {
    "**": ["node_modules/puppeteer/**", "node_modules/@puppeteer/**"],
  },
  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "@tiptap/react",
      "@tiptap/starter-kit",
      "lucide-react",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
    ],
  },
};

// Only wrap with serwist for production builds (webpack)
// In dev, Turbopack is used and serwist is disabled anyway
export default isDev ? nextConfig : withSerwist(nextConfig);
