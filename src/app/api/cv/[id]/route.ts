import { NextResponse } from "next/server";
import { validationError } from "@/lib/api-response";
import { requireResume } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { updateResumeSchema } from "@/lib/validations";

// GET /api/cv/[id] — Get a resume with all its sections
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { resume, response } = await requireResume(request, id, {
    include: { sections: { orderBy: { order: "asc" } } },
  });
  if (response) return response;

  return NextResponse.json({ resume });
}

// PUT /api/cv/[id] — Update resume metadata (title, template, style)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { response } = await requireResume(request, id);
  if (response) return response;

  const body = await request.json();
  const parsed = updateResumeSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { style, ...rest } = parsed.data;
  const resume = await prisma.resume.update({
    where: { id },
    data: {
      ...rest,
      ...(style !== undefined ? { style: style as object } : {}),
    },
    include: { sections: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({ resume });
}

// DELETE /api/cv/[id] — Delete a resume
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { response } = await requireResume(request, id);
  if (response) return response;

  await prisma.resume.delete({ where: { id } });

  return NextResponse.json({ message: "CV supprimé" });
}
