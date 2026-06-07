import { NextResponse } from "next/server";
import { validationError } from "@/lib/api-response";
import { requireResume } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { createSectionSchema } from "@/lib/validations";

// POST /api/cv/[id]/sections — Add a new section to a resume
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { response } = await requireResume(request, id);
  if (response) return response;

  const body = await request.json();
  const parsed = createSectionSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  // Auto-assign order if not provided
  let order = parsed.data.order;
  if (order === undefined) {
    const lastSection = await prisma.section.findFirst({
      where: { resumeId: id },
      orderBy: { order: "desc" },
    });
    order = (lastSection?.order ?? -1) + 1;
  }

  const section = await prisma.section.create({
    data: {
      ...parsed.data,
      order,
      content: parsed.data.content ?? {},
      resumeId: id,
    },
  });

  return NextResponse.json({ section }, { status: 201 });
}
