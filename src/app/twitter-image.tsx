// Single source of truth: reuse the OG card for the Twitter image. Next does not
// auto-copy og:image → twitter:image, so this convention file wires both.
export { default, alt, size, contentType, dynamic } from "./opengraph-image";
