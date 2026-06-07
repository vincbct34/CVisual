import { withRenderedResume } from "./puppeteer-render";

export async function generatePDF(resumeId: string): Promise<Uint8Array> {
  return withRenderedResume(resumeId, async (page) => {
    const pdf = await page.pdf({
      printBackground: true,
      // Use the page's CSS @page box (size + per-page margins) rather than a
      // single uniform margin, so only pages after the first get a top margin.
      preferCSSPageSize: true,
    });
    return new Uint8Array(pdf);
  });
}
