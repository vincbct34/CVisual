import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { importResumeSchema } from "@/lib/validations";
import { TEMPLATES } from "@/components/templates";
import { Prisma } from "@/generated/prisma/client";

export async function POST(request: Request) {
  const { auth, response } = await requireAuth(request);
  if (response) return response;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = importResumeSchema.safeParse(raw);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((e) => e.message).join(", ");
    return NextResponse.json(
      { error: `Structure invalide : ${messages}` },
      { status: 422 },
    );
  }

  const { title, language, template, style, sections } = parsed.data;

  const validTemplates = Object.keys(TEMPLATES);
  const resolvedTemplate =
    template && validTemplates.includes(template) ? template : "classic";

  const resume = await prisma.resume.create({
    data: {
      title: `${title} (importé)`,
      language: language ?? "fr",
      template: resolvedTemplate,
      style: style ?? {
        primaryColor: "#2563eb",
        fontFamily: "Inter",
        fontSize: 14,
      },
      userId: auth.userId,
      sections: {
        create: sections.map((s, i) => ({
          type: s.type,
          title: s.title,
          content: s.content as Prisma.InputJsonValue,
          order: s.order ?? i,
          visible: s.visible ?? true,
        })),
      },
    },
    include: { sections: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({ resume }, { status: 201 });
}
