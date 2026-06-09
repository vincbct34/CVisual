import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { rateLimitResponse } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { createCoverLetterSchema } from "@/lib/validations";

// GET /api/cover-letters — List all cover letters
export async function GET(request: Request) {
  const { auth, response } = await requireAuth(request);
  if (response) return response;

  const coverLetters = await prisma.coverLetter.findMany({
    where: { userId: auth.userId },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ coverLetters });
}

// POST /api/cover-letters — Create a new cover letter
export async function POST(request: Request) {
  const { auth, response } = await requireAuth(request);
  if (response) return response;

  const limited = await rateLimitResponse(
    `cl-create:${auth.userId}`,
    20,
    60_000,
  );
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const parsed = createCoverLetterSchema.safeParse(body);

  const data = parsed.success ? parsed.data : {};

  // Prefill sender details from the linked resume's profile, if any.
  let prefilledSender: Record<string, string> = {};
  if (data.resumeId) {
    const resume = await prisma.resume.findFirst({
      where: { id: data.resumeId, userId: auth.userId },
      include: { sections: { where: { type: "profile" }, take: 1 } },
    });
    const profile = resume?.sections[0]?.content as
      | Record<string, string>
      | undefined;
    if (profile) {
      prefilledSender = {
        senderName: profile.fullName || "",
        senderEmail: profile.email || "",
        senderPhone: profile.phone || "",
        senderLocation: profile.location || "",
      };
    }
  }

  const coverLetter = await prisma.coverLetter.create({
    data: {
      title: data.title || "Ma lettre de motivation",
      language: data.language || "fr",
      resumeId: data.resumeId || null,
      userId: auth.userId,
      content: data.content || {
        recipientName: "",
        companyName: "",
        jobTitle: "",
        body: "",
        ...prefilledSender,
      },
      style: data.style || {
        fontFamily: "Inter",
        fontSize: 14,
        primaryColor: "#1a1a1a",
        lineHeight: 1.5,
        textAlign: "left",
        accent: "minimal",
      },
    },
  });

  return NextResponse.json({ coverLetter }, { status: 201 });
}
