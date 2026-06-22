import { NextResponse } from "next/server";
import { apiMessage } from "@/lib/i18n/api-messages";
import { parseJsonBody } from "@/lib/api-response";
import { requireResume } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { response } = await requireResume(request, id);
  if (response) return response;

  const { body, response: badJson } = await parseJsonBody(request);
  if (badJson) return badJson;
  const { isPublic } = (body ?? {}) as { isPublic?: unknown };

  if (typeof isPublic !== "boolean") {
    return NextResponse.json(
      { error: apiMessage(request, "isPublicBool") },
      { status: 400 },
    );
  }

  const resume = await prisma.resume.update({
    where: { id },
    data: { isPublic },
  });

  return NextResponse.json({ isPublic: resume.isPublic });
}
