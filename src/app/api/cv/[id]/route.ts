import { NextResponse } from "next/server";
import { apiMessage } from "@/lib/i18n/api-messages";
import { validationError, parseJsonBody } from "@/lib/api-response";
import { requireResume } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { rateLimitResponse } from "@/lib/rate-limit";
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

// PUT /api/cv/[id] — Update resume metadata (title, template, style) and,
// optionally, a batch of its sections in a single request. The editor uses the
// batch form so one manual save = one round-trip instead of 1 + N PUTs.
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { auth, response } = await requireResume(request, id);
  if (response) return response;

  // Throttle saves per user: generous enough for the manual button + the slow
  // safety-net autosave, tight enough to block a runaway client.
  const limited = await rateLimitResponse(
    `cv-save:${auth.userId}`,
    30,
    60_000,
    request,
  );
  if (limited) return limited;

  const { body, response: badJson } = await parseJsonBody(request);
  if (badJson) return badJson;
  const parsed = updateResumeSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error, request);

  const { style, sections, ...rest } = parsed.data;

  // Resume metadata + every section land in one transaction so a partial save
  // can't leave the CV half-written. Sections are scoped by resumeId so a
  // forged id can't touch another resume's rows.
  const resume = await prisma.$transaction(
    async (tx) => {
      await tx.resume.update({
        where: { id },
        data: {
          ...rest,
          ...(style !== undefined ? { style: style as object } : {}),
        },
      });

      if (sections) {
        for (const { id: sectionId, content, ...sectionRest } of sections) {
          await tx.section.updateMany({
            where: { id: sectionId, resumeId: id },
            data: {
              ...sectionRest,
              ...(content !== undefined ? { content: content as object } : {}),
            },
          });
        }
      }

      return tx.resume.findUnique({
        where: { id },
        include: { sections: { orderBy: { order: "asc" } } },
      });
    },
    {
      // Up to 30 sequential section writes run inside this interactive tx; on a
      // remote DB the round-trips can exceed Prisma's 5s default and roll back
      // the whole save (P2028). Widen the budget for the worst case.
      maxWait: 5_000,
      timeout: 20_000,
    },
  );

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

  return NextResponse.json({ message: apiMessage(request, "cvDeleted") });
}
