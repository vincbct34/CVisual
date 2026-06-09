import { NextResponse } from "next/server";
import { validationError } from "@/lib/api-response";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { rateLimitResponse, getClientIp } from "@/lib/rate-limit";
import { issueSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // Throttle by IP: 5 signups / hour. Stops automated account-farming.
    const limited = await rateLimitResponse(
      `register:${getClientIp(request)}`,
      5,
      60 * 60_000,
    );
    if (limited) return limited;

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) return validationError(parsed.error);

    const { email, password, name } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
    });

    const accessToken = await issueSession(user);

    return NextResponse.json(
      {
        user: { id: user.id, email: user.email, name: user.name },
        accessToken,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
