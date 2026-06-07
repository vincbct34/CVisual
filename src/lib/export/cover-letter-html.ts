import { withRenderedCoverLetter, capturePageHtml } from "./puppeteer-render";

/**
 * Self-contained HTML export captured from the same `/render/cover-letter/[id]`
 * page Puppeteer uses for the PDF, with every stylesheet inlined. Mirrors the
 * resume `generateHTML` flow so HTML and PDF exports stay pixel-identical and
 * we avoid a hand-maintained Tailwind subset that drifts from the template.
 */
export async function generateCoverLetterHTML(
  coverLetterId: string,
): Promise<string> {
  return withRenderedCoverLetter(coverLetterId, capturePageHtml);
}
