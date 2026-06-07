import { NextResponse } from "next/server";
import { validationError } from "@/lib/api-response";
import { requireResume } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { reorderSectionsSchema } from "@/lib/validations";

// PUT /api/cv/[id]/sections/reorder — Reorder sections
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { response } = await requireResume(request, id);
  if (response) return response;

  const body = await request.json();
  const parsed = reorderSectionsSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  // Update all section orders in a transaction
  await prisma.$transaction(
    parsed.data.sections.map((s) =>
      prisma.section.updateMany({
        where: { id: s.id, resumeId: id },
        data: { order: s.order },
      }),
    ),
  );

  const sections = await prisma.section.findMany({
    where: { resumeId: id },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ sections });
}
