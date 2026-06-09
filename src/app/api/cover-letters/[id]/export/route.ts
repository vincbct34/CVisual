import { NextResponse } from "next/server";
import { requireCoverLetter } from "@/lib/api-auth";
import { rateLimitResponse } from "@/lib/rate-limit";
import { generateCoverLetterPDF } from "@/lib/export/cover-letter-pdf";
import { generateCoverLetterDOCX } from "@/lib/export/cover-letter-docx";
import { generateCoverLetterHTML } from "@/lib/export/cover-letter-html";
import { safeFilename } from "@/lib/utils";

// PDF/HTML export drives headless Chromium — well over the 10s serverless
// default. Requires a Vercel plan that permits a raised limit.
export const maxDuration = 60;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { coverLetter, auth, response } = await requireCoverLetter(request, id);
  if (response) return response;

  // All formats here are heavy (PDF/HTML → Puppeteer, DOCX → server build).
  const limited = await rateLimitResponse(
    `cl-export:${auth.userId}`,
    10,
    60_000,
  );
  if (limited) return limited;

  const url = new URL(request.url);
  const format = url.searchParams.get("format") || "pdf";
  const safeTitle = safeFilename(coverLetter.title);

  try {
    if (format === "pdf") {
      const pdfBuffer = await generateCoverLetterPDF(id);
      return new NextResponse(pdfBuffer as unknown as BodyInit, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${safeTitle}.pdf"`,
        },
      });
    }

    if (format === "docx") {
      const docxBuffer = await generateCoverLetterDOCX(coverLetter);
      return new NextResponse(docxBuffer as unknown as BodyInit, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${safeTitle}.docx"`,
        },
      });
    }

    if (format === "html") {
      const htmlStr = await generateCoverLetterHTML(id);
      return new NextResponse(htmlStr, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="${safeTitle}.html"`,
        },
      });
    }

    return NextResponse.json({ error: "Format non supporté" }, { status: 400 });
  } catch (error) {
    console.error(
      `Cover letter ${format.toUpperCase()} generation error:`,
      error,
    );
    return NextResponse.json(
      { error: `Erreur lors de la génération du ${format.toUpperCase()}` },
      { status: 500 },
    );
  }
}
