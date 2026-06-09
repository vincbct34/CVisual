import { NextResponse } from "next/server";
import { validationError, parseJsonBody } from "@/lib/api-response";
import { requireResume } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { updateSectionSchema } from "@/lib/validations";

// PUT /api/cv/[id]/sections/[sectionId] — Update a section
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> },
) {
  const { id, sectionId } = await params;
  const { response } = await requireResume(request, id);
  if (response) return response;

  const existingSection = await prisma.section.findFirst({
    where: { id: sectionId, resumeId: id },
  });
  if (!existingSection) {
    return NextResponse.json({ error: "Section non trouvée" }, { status: 404 });
  }

  const { body, response: badJson } = await parseJsonBody(request);
  if (badJson) return badJson;
  const parsed = updateSectionSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { content, ...rest } = parsed.data;
  const section = await prisma.section.update({
    where: { id: sectionId },
    data: {
      ...rest,
      ...(content !== undefined ? { content: content as object } : {}),
    },
  });

  return NextResponse.json({ section });
}

// DELETE /api/cv/[id]/sections/[sectionId] — Delete a section
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> },
) {
  const { id, sectionId } = await params;
  const { response } = await requireResume(request, id);
  if (response) return response;

  const existingSection = await prisma.section.findFirst({
    where: { id: sectionId, resumeId: id },
  });
  if (!existingSection) {
    return NextResponse.json({ error: "Section non trouvée" }, { status: 404 });
  }

  await prisma.section.delete({ where: { id: sectionId } });

  return NextResponse.json({ message: "Section supprimée" });
}
