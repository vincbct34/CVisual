import DOMPurify from "dompurify";

export const TIPTAP_ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "a",
  "blockquote",
  "code",
  "pre",
  "hr",
  "span",
  "div",
  "sub",
  "sup",
];

export const TIPTAP_ALLOWED_ATTR = ["href", "target", "rel", "class"];

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: TIPTAP_ALLOWED_TAGS,
    ALLOWED_ATTR: TIPTAP_ALLOWED_ATTR,
  });
}
