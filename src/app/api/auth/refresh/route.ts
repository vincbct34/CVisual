import { NextResponse } from "next/server";
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

export async function POST() {
  try {
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
        { error: "Refresh token invalide" },
        { status: 401 },
      );
    }

    const isValid = await isRefreshTokenValid(oldToken);
    if (!isValid) {
      return NextResponse.json(
        { error: "Refresh token révoqué" },
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
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
