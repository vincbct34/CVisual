import { NextResponse } from "next/server";
import { getAuthFromRequest, type JWTPayload } from "./auth";
import { prisma } from "./prisma";
import { Prisma } from "@/generated/prisma/client";

/**
 * Route-handler auth guard. Returns the verified payload, or a ready-to-return
 * 401 response — so every API route shares one auth check and one error shape:
 *
 *   const { auth, response } = await requireAuth(request);
 *   if (response) return response;
 *   // ...use auth.userId
 */
export async function requireAuth(
  request: Request,
): Promise<
  { auth: JWTPayload; response: null } | { auth: null; response: NextResponse }
> {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return {
      auth: null,
      response: NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 },
      ),
    };
  }
  return { auth, response: null };
}

/**
 * Auth + ownership guard for a Resume. Combines `requireAuth`, the owner-scoped
 * `findFirst`, and the 404 (returned instead of 403 so existence isn't leaked):
 *
 *   const { resume, auth, response } = await requireResume(request, id, {
 *     include: { sections: { orderBy: { order: "asc" } } },
 *   });
 *   if (response) return response;
 *
 * `args` (include/select) flow through to Prisma, so `resume` is typed exactly
 * to the requested shape.
 */
export async function requireResume<
  T extends Omit<Prisma.ResumeFindFirstArgs, "where"> = object,
>(
  request: Request,
  id: string,
  args?: T,
): Promise<
  | { resume: Prisma.ResumeGetPayload<T>; auth: JWTPayload; response: null }
  | { resume: null; auth: null; response: NextResponse }
> {
  const { auth, response } = await requireAuth(request);
  if (response) return { resume: null, auth: null, response };

  const resume = (await prisma.resume.findFirst({
    ...args,
    where: { id, userId: auth.userId },
  })) as Prisma.ResumeGetPayload<T> | null;

  if (!resume) {
    return {
      resume: null,
      auth: null,
      response: NextResponse.json({ error: "CV non trouvé" }, { status: 404 }),
    };
  }
  return { resume, auth, response: null };
}

/** Auth + ownership guard for a CoverLetter (mirrors {@link requireResume}). */
export async function requireCoverLetter<
  T extends Omit<Prisma.CoverLetterFindFirstArgs, "where"> = object,
>(
  request: Request,
  id: string,
  args?: T,
): Promise<
  | {
      coverLetter: Prisma.CoverLetterGetPayload<T>;
      auth: JWTPayload;
      response: null;
    }
  | { coverLetter: null; auth: null; response: NextResponse }
> {
  const { auth, response } = await requireAuth(request);
  if (response) return { coverLetter: null, auth: null, response };

  const coverLetter = (await prisma.coverLetter.findFirst({
    ...args,
    where: { id, userId: auth.userId },
  })) as Prisma.CoverLetterGetPayload<T> | null;

  if (!coverLetter) {
    return {
      coverLetter: null,
      auth: null,
      response: NextResponse.json(
        { error: "Lettre non trouvée" },
        { status: 404 },
      ),
    };
  }
  return { coverLetter, auth, response: null };
}
