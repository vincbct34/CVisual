import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { validationError } from "@/lib/api-response";
import { updateProfileSchema } from "@/lib/validations";
import { clearRefreshTokenCookie } from "@/lib/auth";

export async function GET(request: Request) {
  const { auth, response } = await requireAuth(request);
  if (response) return response;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Utilisateur non trouvé" },
      { status: 404 },
    );
  }

  return NextResponse.json({ user });
}

export async function PUT(request: Request) {
  const { auth, response } = await requireAuth(request);
  if (response) return response;

  const parsed = updateProfileSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);
  const { name, email } = parsed.data;

  // Reject an email already used by another account
  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== auth.userId) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 409 },
      );
    }
  }

  const user = await prisma.user.update({
    where: { id: auth.userId },
    data: { ...(name !== undefined && { name }), ...(email && { email }) },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  return NextResponse.json({ user });
}

export async function DELETE(request: Request) {
  const { auth, response } = await requireAuth(request);
  if (response) return response;

  // Cascade removes resumes, cover letters, refresh + reset tokens
  await prisma.user.delete({ where: { id: auth.userId } });
  await clearRefreshTokenCookie();

  return NextResponse.json({ message: "Compte supprimé" });
}
