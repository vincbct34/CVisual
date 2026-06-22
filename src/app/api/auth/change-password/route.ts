import { NextResponse } from "next/server";
import { apiMessage } from "@/lib/i18n/api-messages";
import bcrypt from "bcryptjs";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { validationError, parseJsonBody } from "@/lib/api-response";
import { changePasswordSchema } from "@/lib/validations";
import { getRefreshTokenFromCookie } from "@/lib/auth";
import { rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const { auth, response } = await requireAuth(request);
  if (response) return response;

  // Throttle to blunt online guessing of the current password.
  const limited = await rateLimitResponse(
    `change-password:${auth.userId}`,
    5,
    15 * 60_000,
    request,
  );
  if (limited) return limited;

  const { body, response: badJson } = await parseJsonBody(request);
  if (badJson) return badJson;
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error, request);
  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { passwordHash: true },
  });
  if (!user) {
    return NextResponse.json(
      { error: apiMessage(request, "userNotFound") },
      { status: 404 },
    );
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { error: "Mot de passe actuel incorrect" },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: auth.userId },
    data: { passwordHash },
  });

  // Revoke every other session; keep the current one valid
  const currentRefreshToken = await getRefreshTokenFromCookie();
  await prisma.refreshToken.deleteMany({
    where: {
      userId: auth.userId,
      ...(currentRefreshToken && { token: { not: currentRefreshToken } }),
    },
  });

  return NextResponse.json({ message: apiMessage(request, "passwordChanged") });
}
