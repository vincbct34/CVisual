import { NextResponse } from "next/server";
import { apiMessage } from "@/lib/i18n/api-messages";
import { prisma } from "@/lib/prisma";
import { rateLimitResponse, getClientIp } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    // Throttle by IP to blunt brute-forcing of reset tokens.
    const limited = await rateLimitResponse(
      `reset-password:${getClientIp(request)}`,
      10,
      15 * 60_000,
      request,
    );
    if (limited) return limited;

    const { token, password } = await request.json();

    if (
      !token ||
      typeof token !== "string" ||
      !password ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return NextResponse.json(
        { error: apiMessage(request, "invalidData") },
        { status: 400 },
      );
    }

    await prisma.resetToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    const resetToken = await prisma.resetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: apiMessage(request, "tokenInvalidExpired") },
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
      { error: apiMessage(request, "serverError") },
      { status: 500 },
    );
  }
}
