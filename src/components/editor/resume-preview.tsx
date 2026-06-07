"use client";

import { TEMPLATES } from "@/components/templates";
import {
  sidebarPageBackground,
  pageTopMarginMm,
} from "@/components/templates/page-background";
import { PagedPreview } from "./paged-preview";
import type { Resume } from "@/types/resume";

interface ResumePreviewProps {
  resume: Resume;
}

export function ResumePreview({ resume }: ResumePreviewProps) {
  const TemplateComponent =
    TEMPLATES[resume.template]?.component ?? TEMPLATES.classic.component;

  // Mirror the PDF render target: same per-page background (so a sidebar column
  // fills every sheet) and same top margin on pages after the first.
  const pageBackground = sidebarPageBackground(resume.template, resume);
  const topMarginMm = pageTopMarginMm(resume.template, resume);

  return (
    <div className="editor-preview-area p-3 sm:p-4 lg:p-6 overflow-auto h-full">
      <PagedPreview pageBackground={pageBackground} topMarginMm={topMarginMm}>
        <TemplateComponent resume={resume} />
      </PagedPreview>
    </div>
  );
}
