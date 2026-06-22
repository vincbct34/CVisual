import { NextResponse } from "next/server";
import { apiMessage } from "@/lib/i18n/api-messages";
import { validationError, parseJsonBody } from "@/lib/api-response";
import { requireAuth } from "@/lib/api-auth";
import { rateLimitResponse } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { createResumeSchema } from "@/lib/validations";
import { DEFAULT_STYLE } from "@/types/resume";

// GET /api/cv — List all resumes for the authenticated user
export async function GET(request: Request) {
  const { auth, response } = await requireAuth(request);
  if (response) return response;

  const resumes = await prisma.resume.findMany({
    where: { userId: auth.userId },
    include: { sections: { orderBy: { order: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ resumes });
}

// POST /api/cv — Create a new resume
export async function POST(request: Request) {
  const { auth, response } = await requireAuth(request);
  if (response) return response;

  const limited = await rateLimitResponse(
    `cv-create:${auth.userId}`,
    20,
    60_000,
    request,
  );
  if (limited) return limited;

  const { body, response: badJson } = await parseJsonBody(request);
  if (badJson) return badJson;
  const parsed = createResumeSchema.safeParse(body);

  if (!parsed.success) return validationError(parsed.error, request);

  const resume = await prisma.resume.create({
    data: {
      ...parsed.data,
      userId: auth.userId,
      style: { ...DEFAULT_STYLE },
      sections: {
        create: [
          {
            type: "profile",
            title: apiMessage(request, "defaultProfile"),
            content: {
              fullName: "",
              jobTitle: "",
              summary: "",
              email: "",
              phone: "",
              location: "",
              website: "",
            },
            order: 0,
          },
          {
            type: "experience",
            title: apiMessage(request, "defaultExperience"),
            content: { items: [] },
            order: 1,
          },
          {
            type: "education",
            title: apiMessage(request, "defaultEducation"),
            content: { items: [] },
            order: 2,
          },
          {
            type: "skills",
            title: apiMessage(request, "defaultSkills"),
            content: { items: [] },
            order: 3,
          },
          {
            type: "languages",
            title: apiMessage(request, "defaultLanguages"),
            content: { items: [] },
            order: 4,
          },
        ],
      },
    },
    include: { sections: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({ resume }, { status: 201 });
}
