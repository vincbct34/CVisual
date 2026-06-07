import { prisma } from "@/lib/prisma";
import { verifyShareToken } from "@/lib/auth";
import { notFound } from "next/navigation";
import { ResumeDocument } from "@/components/templates/resume-document";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ token: string }>;
}

// The share token lives in the URL; a referrer header would leak it to any
// outbound link or asset the page loads. no-referrer keeps the token private.
export const metadata: Metadata = {
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default async function SharePage({ params }: Props) {
  const { token } = await params;

  const resumeId = await verifyShareToken(token);
  if (!resumeId) notFound();

  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
    include: { sections: { orderBy: { order: "asc" } } },
  });
  if (!resume) notFound();

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
      <div className="max-w-4xl mx-auto">
        <ResumeDocument resume={resumeData} />
      </div>
    </div>
  );
}
