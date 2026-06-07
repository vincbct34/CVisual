import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { auth, response } = await requireAuth(request);
  if (response) return response;

  const sessions = await prisma.refreshToken.findMany({
    where: { userId: auth.userId, expiresAt: { gt: new Date() } },
    select: { id: true, createdAt: true, expiresAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ sessions });
}

export async function DELETE(request: Request) {
  const { auth, response } = await requireAuth(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("id");
  if (!sessionId) {
    return NextResponse.json(
      { error: "ID de session requis" },
      { status: 400 },
    );
  }

  // Verify the session belongs to this user before deleting
  const deleted = await prisma.refreshToken.deleteMany({
    where: { id: sessionId, userId: auth.userId },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}
