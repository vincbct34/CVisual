import type { Resume } from "@/types/resume";

/**
 * Page background that lets a sidebar column reach the bottom of every page
 * (print AND on-screen preview). Modern: accent band on the left 34%.
 * Creative: light sidebar on the right 30% (only when a sidebar section
 * actually has content). Other templates stay white.
 *
 * Shared by the Puppeteer render target (`/render/[id]`) and the editor's
 * `PagedPreview` so both fill every page identically — the print engine paints
 * this on `html`, the preview paints it on each A4 sheet.
 */
export function sidebarPageBackground(
  template: string,
  resume: Resume,
): string {
  const style = resume.style;

  if (template === "modern") {
    const accent = style.primaryColor || "#2563eb";
    // Absolute stop (34% of 210mm) so the column is the exact same width on
    // every page — a % stop can resolve to a slightly different box per page.
    return `linear-gradient(to right, ${accent} 0, ${accent} 71.4mm, #ffffff 71.4mm)`;
  }

  if (template === "creative") {
    const inSidebar = (s: Resume["sections"][number]) =>
      style.sidebarSections
        ? style.sidebarSections.includes(s.id)
        : ["skills", "languages", "interests"].includes(s.type);
    const hasItems = (s: Resume["sections"][number]) => {
      const c = s.content as Record<string, unknown> | undefined;
      if (s.type === "custom" || !s.type) {
        return Boolean((c?.text as string)?.trim());
      }
      return ((c?.items as unknown[] | undefined) ?? []).length > 0;
    };
    const hasSidebar = resume.sections.some(
      (s) => s.visible && s.type !== "profile" && inSidebar(s) && hasItems(s),
    );
    if (hasSidebar) {
      // 70% of 210mm = 147mm (sidebar is the right 30%).
      return `linear-gradient(to right, #ffffff 0, #ffffff 147mm, #f9fafb 147mm)`;
    }
  }

  return "#ffffff";
}

// Top margin (mm) on pages after the first, for text-only templates.
export const PAGE_TOP_MARGIN_MM = 14;

/**
 * Top margin (in mm) applied to pages AFTER the first. Sidebar templates stay
 * full-bleed (0): the @page margin area can't be painted by any element, so a
 * top margin would leave a blank band above the colored column. Text-only
 * templates get a real top margin so text isn't glued to the sheet edge.
 * Mirrors the render target's `@page` rule — keep them identical.
 */
export function pageTopMarginMm(template: string, resume: Resume): number {
  return sidebarPageBackground(template, resume) === "#ffffff"
    ? PAGE_TOP_MARGIN_MM
    : 0;
}
