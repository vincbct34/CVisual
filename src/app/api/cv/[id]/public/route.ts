import { NextResponse } from "next/server";
import { requireResume } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { response } = await requireResume(request, id);
  if (response) return response;

  const body = await request.json();
  const { isPublic } = body;

  if (typeof isPublic !== "boolean") {
    return NextResponse.json(
      { error: "Le paramètre isPublic doit être un booléen" },
      { status: 400 },
    );
  }

  const resume = await prisma.resume.update({
    where: { id },
    data: { isPublic },
  });

  return NextResponse.json({ isPublic: resume.isPublic });
}
