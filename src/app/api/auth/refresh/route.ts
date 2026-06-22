import { NextResponse } from "next/server";
import { apiMessage } from "@/lib/i18n/api-messages";
import {
  getRefreshTokenFromCookie,
  verifyRefreshToken,
  isRefreshTokenValid,
  revokeRefreshToken,
  signAccessToken,
  signRefreshToken,
  storeRefreshToken,
  setRefreshTokenCookie,
} from "@/lib/auth";
import { rateLimitResponse, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    // Loose IP cap — legit clients refresh ~every 15min; this only stops a
    // runaway loop hammering the endpoint.
    const limited = await rateLimitResponse(
      `refresh:${getClientIp(request)}`,
      60,
      60_000,
      request,
    );
    if (limited) return limited;

    const oldToken = await getRefreshTokenFromCookie();
    if (!oldToken) {
      return NextResponse.json(
        { error: "Refresh token manquant" },
        { status: 401 },
      );
    }

    const payload = await verifyRefreshToken(oldToken);
    if (!payload) {
      return NextResponse.json(
        { error: apiMessage(request, "refreshInvalid") },
        { status: 401 },
      );
    }

    const isValid = await isRefreshTokenValid(oldToken);
    if (!isValid) {
      return NextResponse.json(
        { error: apiMessage(request, "refreshRevoked") },
        { status: 401 },
      );
    }

    // Rotate: revoke old, issue new
    await revokeRefreshToken(oldToken);

    const newPayload = { userId: payload.userId, email: payload.email };
    const accessToken = await signAccessToken(newPayload);
    const refreshToken = await signRefreshToken(newPayload);

    await storeRefreshToken(payload.userId, refreshToken);
    await setRefreshTokenCookie(refreshToken);

    return NextResponse.json({ accessToken });
  } catch {
    return NextResponse.json(
      { error: apiMessage(request, "serverError") },
      { status: 500 },
    );
  }
}
