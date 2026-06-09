import { NextResponse } from "next/server";
import { requireResume } from "@/lib/api-auth";
import { rateLimitResponse } from "@/lib/rate-limit";
import { generatePDF } from "@/lib/export/pdf";
import { generateDOCX } from "@/lib/export/docx";
import { generateHTML } from "@/lib/export/html";
import { safeFilename } from "@/lib/utils";
import type { ResumeStyle, Section } from "@/types/resume";

// PDF/HTML export drives headless Chromium — well over the 10s serverless
// default. Requires a Vercel plan that permits a raised limit.
export const maxDuration = 60;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { resume, auth, response } = await requireResume(request, id, {
    include: { sections: { orderBy: { order: "asc" } } },
  });
  if (response) return response;

  const url = new URL(request.url);
  const format = url.searchParams.get("format") || "pdf";
  const safeTitle = safeFilename(resume.title);

  // Throttle the heavy formats (PDF/HTML → Puppeteer, DOCX → server build).
  // JSON is a cheap DB serialize, so it stays unthrottled.
  if (format !== "json") {
    const limited = await rateLimitResponse(
      `cv-export:${auth.userId}`,
      10,
      60_000,
    );
    if (limited) return limited;
  }

  if (format === "json") {
    // Return clean, reimportable JSON
    const { userId: _userId, ...exportData } = resume;
    return NextResponse.json(exportData, {
      headers: {
        "Content-Disposition": `attachment; filename="${safeTitle}.json"`,
      },
    });
  }

  if (format === "pdf") {
    try {
      const pdfBuffer = await generatePDF(id);
      return new NextResponse(pdfBuffer as unknown as BodyInit, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${safeTitle}.pdf"`,
        },
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la génération du PDF" },
        { status: 500 },
      );
    }
  }

  if (format === "docx") {
    try {
      const style = resume.style as unknown as ResumeStyle;
      const sections = resume.sections as unknown as Section[];
      const buffer = await generateDOCX(sections, style, resume.title);
      return new NextResponse(buffer as unknown as BodyInit, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${safeTitle}.docx"`,
        },
      });
    } catch (error) {
      console.error("DOCX generation error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la génération du DOCX" },
        { status: 500 },
      );
    }
  }

  if (format === "html") {
    try {
      const html = await generateHTML(id);
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="${safeTitle}.html"`,
        },
      });
    } catch (error) {
      console.error("HTML generation error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la génération du HTML" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ error: "Format non supporté" }, { status: 400 });
}
