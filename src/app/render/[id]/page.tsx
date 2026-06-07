import { prisma } from "@/lib/prisma";
import { verifyRenderToken } from "@/lib/auth";
import { notFound } from "next/navigation";
import { createElement } from "react";
import { getTemplate } from "@/components/templates";
import {
  sidebarPageBackground,
  PAGE_TOP_MARGIN_MM,
} from "@/components/templates/page-background";
import type { Resume, ResumeStyle } from "@/types/resume";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

// Headless, token-gated target — never index.
export const metadata: Metadata = { robots: { index: false, follow: false } };

// Headless render target for Puppeteer (PDF + HTML export). Rendered entirely
// on the server so the template HTML is present on first paint — no client
// dynamic import, no hydration wait, no networkidle race.
export default async function RenderPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { token } = await searchParams;

  if (!token || !(await verifyRenderToken(token, id))) {
    notFound();
  }

  const resume = await prisma.resume.findUnique({
    where: { id },
    include: { sections: { orderBy: { order: "asc" } } },
  });

  if (!resume) {
    notFound();
  }

  const resumeData: Resume = {
    ...resume,
    style: resume.style as unknown as ResumeStyle,
    sections: resume.sections.map((s) => ({
      ...s,
      content: s.content as Record<string, unknown>,
    })),
    createdAt: resume.createdAt.toISOString(),
    updatedAt: resume.updatedAt.toISOString(),
  };

  // Sidebar templates paint their column as the PAGE (html) background so it
  // reaches the bottom of every page — including a short final page — which a
  // flex-child background (sized to content height) can't do in print.
  const pageBackground = sidebarPageBackground(resume.template, resumeData);
  const hasSidebar = pageBackground !== "#ffffff";

  // Text-only templates get a top margin on pages after the first so text isn't
  // glued to the edge. Sidebar templates stay full-bleed (margin 0): the @page
  // margin area can't be painted by ANY element (not even position:fixed), so a
  // top margin would leave a blank band above the colored column. The trade-off
  // is text touching the top of continuation pages on sidebar layouts.
  const pageRule = hasSidebar
    ? `@page { size: A4; margin: 0; }`
    : `@page { size: A4; margin: ${PAGE_TOP_MARGIN_MM}mm 0 0 0; } @page :first { margin: 0; }`;

  return (
    <>
      <style>{`
        html, body { margin: 0; padding: 0; }
        /* The app's global body background + fixed ::before vignette must not
           apply here: a body background blocks the html background from
           propagating to fill the whole page (so the sidebar column would stop
           at the content bottom), and a fixed ::before would tint every printed
           page. Keep body transparent so the html gradient backs every page. */
        body { background: transparent !important; min-height: 0 !important; }
        body::before, body::after { content: none !important; display: none !important; }
        /* Root background propagates to the page canvas (fills every page,
           including a short final page). Its column edge is measured from x=0,
           so the cv-page must also sit at x=0 (no centering) or the <aside> and
           the page background won't line up — see .cv-page margin below. */
        html { background: ${pageBackground}; }
        * { box-sizing: border-box; }
        ${pageRule}
        @media print { .cv-page { box-shadow: none; } }
        /* In print the sidebar column AND the main column are painted entirely
           by the page-background gradient. Both <aside> and <main> backgrounds
           are dropped so nothing clips the gradient: the column edge is then a
           single source on every page (no step where content ends, where a
           white <main> would otherwise clip the gradient a few px short).
           Screen/preview keeps these backgrounds (no gradient there). */
        @media print {
          aside, main { background-color: transparent !important; }
        }
        /* Match the editor's paged preview: break between text-element
           boundaries (paragraphs / list items / headings), never inside a
           line, and keep a heading attached to the content that follows. */
        p, li, h1, h2, h3, h4, h5, img { break-inside: avoid; }
        h1, h2, h3, h4, h5 { break-after: avoid; }
      `}</style>
      <div
        className="cv-page"
        // Left-aligned (margin 0, NOT auto): the page is exactly 210mm wide, so
        // centering would offset the sidebar from the page-background gradient
        // (which is anchored at x=0) and produce a step where content ends.
        style={{ width: "210mm", minHeight: "297mm", margin: 0 }}
      >
        {createElement(getTemplate(resume.template), { resume: resumeData })}
      </div>
    </>
  );
}
