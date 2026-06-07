import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (
      !token ||
      typeof token !== "string" ||
      !password ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    await prisma.resetToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    const resetToken = await prisma.resetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    await prisma.resetToken.deleteMany({
      where: { userId: resetToken.userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
