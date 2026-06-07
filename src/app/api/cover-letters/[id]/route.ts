import { NextResponse } from "next/server";
import { validationError } from "@/lib/api-response";
import { requireCoverLetter } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { updateCoverLetterSchema } from "@/lib/validations";

// GET /api/cover-letters/:id
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { coverLetter, response } = await requireCoverLetter(request, id);
  if (response) return response;

  return NextResponse.json({ coverLetter });
}

// PUT /api/cover-letters/:id
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { response } = await requireCoverLetter(request, id);
  if (response) return response;

  const body = await request.json();
  const parsed = updateCoverLetterSchema.safeParse(body);

  if (!parsed.success) return validationError(parsed.error);

  const { content, style, ...rest } = parsed.data;

  const coverLetter = await prisma.coverLetter.update({
    where: { id },
    data: {
      ...rest,
      ...(content !== undefined ? { content: content as object } : {}),
      ...(style !== undefined ? { style: style as object } : {}),
    },
  });

  return NextResponse.json({ coverLetter });
}

// DELETE /api/cover-letters/:id
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { response } = await requireCoverLetter(request, id);
  if (response) return response;

  await prisma.coverLetter.delete({ where: { id } });
  return NextResponse.json({ message: "Lettre supprimée" });
}
