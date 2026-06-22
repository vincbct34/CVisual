import { NextResponse } from "next/server";
import { apiMessage } from "@/lib/i18n/api-messages";
import {
  getRefreshTokenFromCookie,
  getUserIdFromRefreshToken,
  revokeAllUserRefreshTokens,
  clearRefreshTokenCookie,
} from "@/lib/auth";

export async function POST(request: Request) {
  // Read token before clearing the cookie
  let userId: string | null = null;
  try {
    const refreshToken = await getRefreshTokenFromCookie();
    if (refreshToken) {
      // DB lookup — works even when the refresh token JWT is expired
      userId = await getUserIdFromRefreshToken(refreshToken);
    }
  } catch {
    // DB unavailable — continue; cookie will still be cleared
  }

  // Always clear the cookie regardless of DB state
  await clearRefreshTokenCookie();

  if (userId) {
    try {
      await revokeAllUserRefreshTokens(userId);
    } catch {
      // Transient DB error — cookie is already cleared so client is logged out
    }
  }

  return NextResponse.json({ message: apiMessage(request, "loggedOut") });
}
