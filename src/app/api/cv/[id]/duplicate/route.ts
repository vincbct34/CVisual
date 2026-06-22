import { NextResponse } from "next/server";
import { apiMessage } from "@/lib/i18n/api-messages";
import { requireResume } from "@/lib/api-auth";
import { rateLimitResponse } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const {
    resume: original,
    auth,
    response,
  } = await requireResume(request, id, {
    include: { sections: { orderBy: { order: "asc" } } },
  });
  if (response) return response;

  // Deep copy (all sections) — also the AI-translation path. Cap per user.
  const limited = await rateLimitResponse(
    `cv-duplicate:${auth.userId}`,
    10,
    60_000,
    request,
  );
  if (limited) return limited;

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // No body is fine — just a plain duplicate
  }

  const language = (body.language as string) || original.language;
  const isTranslation = language !== original.language;

  // parentId: if this is a translation, link to the original (or the original's parent)
  const parentId = isTranslation ? (original.parentId ?? original.id) : null;

  const suffix = isTranslation ? ` (${language.toUpperCase()})` : " (copie)";

  try {
    const duplicate = await prisma.resume.create({
      data: {
        title: `${original.title}${suffix}`,
        language,
        template: original.template,
        style: original.style as object,
        userId: auth.userId,
        parentId,
        sections: {
          create: original.sections.map((s) => ({
            type: s.type,
            title: s.title,
            content: s.content as object,
            order: s.order,
            visible: s.visible,
          })),
        },
      },
      include: { sections: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({ resume: duplicate }, { status: 201 });
  } catch (error) {
    console.error("Duplicate error:", error);
    return NextResponse.json(
      { error: apiMessage(request, "duplicateError") },
      { status: 500 },
    );
  }
}
