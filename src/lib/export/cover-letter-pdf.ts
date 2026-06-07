import { withRenderedCoverLetter } from "./puppeteer-render";

export async function generateCoverLetterPDF(
  coverLetterId: string,
): Promise<Uint8Array> {
  return withRenderedCoverLetter(coverLetterId, async (page) => {
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return new Uint8Array(pdf);
  });
}
