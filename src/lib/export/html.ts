import { withRenderedResume, capturePageHtml } from "./puppeteer-render";

/**
 * Produces a self-contained HTML export by capturing the same `/render/[id]`
 * page Puppeteer uses for the PDF, with all stylesheets inlined. This replaces
 * the previous hand-maintained Tailwind subset, which drifted from the real
 * templates and rendered exports unstyled.
 */
export async function generateHTML(resumeId: string): Promise<string> {
  return withRenderedResume(resumeId, capturePageHtml);
}
