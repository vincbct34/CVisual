// Single source of truth: reuse the locale-specific OG card for the Twitter
// image. Next does not auto-copy og:image -> twitter:image.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export { default, generateImageMetadata } from "./opengraph-image";
