import { NextResponse } from "next/server";
import { validationError } from "@/lib/api-response";
import { requireAuth } from "@/lib/api-auth";
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

  const body = await request.json();
  const parsed = createResumeSchema.safeParse(body);

  if (!parsed.success) return validationError(parsed.error);

  const resume = await prisma.resume.create({
    data: {
      ...parsed.data,
      userId: auth.userId,
      style: { ...DEFAULT_STYLE },
      sections: {
        create: [
          {
            type: "profile",
            title: "Profil",
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
            title: "Expériences professionnelles",
            content: { items: [] },
            order: 1,
          },
          {
            type: "education",
            title: "Formation",
            content: { items: [] },
            order: 2,
          },
          {
            type: "skills",
            title: "Compétences",
            content: { items: [] },
            order: 3,
          },
          {
            type: "languages",
            title: "Langues",
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
