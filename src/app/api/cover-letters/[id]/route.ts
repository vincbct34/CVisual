import { NextResponse } from "next/server";
import { apiMessage } from "@/lib/i18n/api-messages";
import { validationError, parseJsonBody } from "@/lib/api-response";
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

  const { body, response: badJson } = await parseJsonBody(request);
  if (badJson) return badJson;
  const parsed = updateCoverLetterSchema.safeParse(body);

  if (!parsed.success) return validationError(parsed.error, request);

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
  return NextResponse.json({ message: apiMessage(request, "letterDeleted") });
}
