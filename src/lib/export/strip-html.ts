/**
 * Flatten Tiptap/HTML rich text into newline-separated plain text for DOCX
 * export — block tags and `<br>` become newlines, `<li>` becomes a bullet, and
 * the common named entities are decoded. Dependency-free so it stays cheap to
 * import into the server-side document generators.
 */
export function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<\/(p|div|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n\s*\n/g, "\n")
    .trim();
}
