import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ResumeDocument } from "@/components/templates/resume-document";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

// Owner-opted "public" link, but personal CVs shouldn't surface in search.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PublicResumePage({ params }: Props) {
  const { id } = await params;

  const resume = await prisma.resume.findUnique({
    where: { id },
    include: { sections: { orderBy: { order: "asc" } } },
  });

  // If not found or not marked as public, return 404
  if (!resume || !resume.isPublic) {
    notFound();
  }

  const resumeData = {
    ...resume,
    style: resume.style as Record<string, unknown>,
    sections: resume.sections.map((s: (typeof resume.sections)[number]) => ({
      ...s,
      content: s.content as Record<string, unknown>,
    })),
    createdAt: resume.createdAt.toISOString(),
    updatedAt: resume.updatedAt.toISOString(),
  };

  return (
    <div className="min-h-screen py-8 editor-preview-area">
      <ResumeDocument resume={resumeData} />
    </div>
  );
}
