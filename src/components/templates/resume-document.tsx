import { createElement } from "react";
import { getTemplate } from "./index";
import type { Resume, ResumeStyle } from "@/types/resume";

/**
 * Server-rendered A4 resume card. Shared by the public-CV and share-link viewer
 * pages so they render the exact same templates as the editor preview and the
 * PDF/HTML export — one rendering path everywhere.
 */
export function ResumeDocument({
  resume,
}: {
  resume: Omit<Resume, "style"> & { style: Record<string, unknown> };
}) {
  const typed = {
    ...resume,
    style: resume.style as unknown as ResumeStyle,
  } as Resume;

  return (
    <div
      className="shadow-lg cv-doc-fit"
      style={{
        width: "210mm",
        minHeight: "297mm",
        margin: "0 auto",
        background: "#fff",
      }}
    >
      {createElement(getTemplate(resume.template), { resume: typed })}
    </div>
  );
}
