import { prisma } from "@/lib/prisma";
import { verifyRenderToken } from "@/lib/auth";
import { notFound } from "next/navigation";
import { RenderCoverLetterClient } from "./render-client";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

// Headless, token-gated target — never index.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function RenderCoverLetterPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const { token } = await searchParams;

  if (!token || !(await verifyRenderToken(token, id))) {
    notFound();
  }

  const coverLetter = await prisma.coverLetter.findUnique({
    where: { id },
  });

  if (!coverLetter) {
    notFound();
  }

  const data = {
    content: coverLetter.content as Record<string, unknown>,
    style: coverLetter.style as Record<string, unknown>,
  };

  return <RenderCoverLetterClient content={data.content} style={data.style} />;
}
