import { NextResponse } from "next/server";
import { apiMessage } from "@/lib/i18n/api-messages";
import { validationError } from "@/lib/api-response";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { rateLimitResponse, getClientIp } from "@/lib/rate-limit";
import { issueSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // Throttle by IP: 10 login attempts / 15 min. Blunts brute-force and
    // credential stuffing without locking out legitimate retries.
    const limited = await rateLimitResponse(
      `login:${getClientIp(request)}`,
      10,
      15 * 60_000,
      request,
    );
    if (limited) return limited;

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) return validationError(parsed.error, request);

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });

    // Always run bcrypt to prevent timing-based email enumeration
    const hashToCompare =
      user?.passwordHash ??
      "$2a$12$invalidhashfortimingattackprevention000000000000000000000";
    const passwordValid = await bcrypt.compare(password, hashToCompare);

    if (!user || !passwordValid) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 },
      );
    }

    const accessToken = await issueSession(user);

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
    });
  } catch {
    return NextResponse.json(
      { error: apiMessage(request, "serverError") },
      { status: 500 },
    );
  }
}
