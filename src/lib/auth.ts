import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const JWT_REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET!,
);

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export interface JWTPayload {
  userId: string;
  email: string;
}

export async function signAccessToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function signRefreshToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_REFRESH_SECRET);
}

export async function verifyAccessToken(
  token: string,
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(
  token: string,
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function setRefreshTokenCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("refresh_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

export async function getRefreshTokenFromCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("refresh_token")?.value;
}

export async function clearRefreshTokenCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("refresh_token");
}

export async function storeRefreshToken(
  userId: string,
  token: string,
): Promise<void> {
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE * 1000);
  await prisma.refreshToken.create({
    data: { token, userId, expiresAt },
  });
}

/**
 * Issue a fresh login session: sign access + refresh tokens, persist the
 * refresh token, and set its httpOnly cookie. Returns the access token for the
 * JSON body. Shared by /login and /register.
 */
export async function issueSession(user: {
  id: string;
  email: string;
}): Promise<string> {
  const payload = { userId: user.id, email: user.email };
  const accessToken = await signAccessToken(payload);
  const refreshToken = await signRefreshToken(payload);
  await storeRefreshToken(user.id, refreshToken);
  await setRefreshTokenCookie(refreshToken);
  return accessToken;
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { token } });
}

export async function revokeAllUserRefreshTokens(
  userId: string,
): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

export async function getUserIdFromRefreshToken(
  token: string,
): Promise<string | null> {
  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  return stored?.userId ?? null;
}

export async function isRefreshTokenValid(token: string): Promise<boolean> {
  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored) return false;
  if (stored.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    return false;
  }
  return true;
}

/**
 * Extract and verify the access token from the Authorization header.
 * Returns the JWT payload or null if invalid/missing.
 */
export async function getAuthFromRequest(
  request: Request,
): Promise<JWTPayload | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  return verifyAccessToken(token);
}

// Share tokens expire after 30 days. A public /share link leaks full resume
// PII (name, email, phone, location), so it must not stay valid forever if the
// URL leaks (referrer header, browser history, forwarded link). Re-share to
// mint a fresh token; delete the resume to revoke all outstanding links early.
const SHARE_TOKEN_EXPIRY = "30d";

export async function signShareToken(resumeId: string): Promise<string> {
  return new SignJWT({ resumeId, purpose: "share" } as unknown as Record<
    string,
    unknown
  >)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SHARE_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyShareToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.purpose !== "share" || typeof payload.resumeId !== "string")
      return null;
    return payload.resumeId;
  } catch {
    return null;
  }
}

export async function signRenderToken(resourceId: string): Promise<string> {
  return new SignJWT({ resourceId, purpose: "render" } as unknown as Record<
    string,
    unknown
  >)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(JWT_SECRET);
}

export async function verifyRenderToken(
  token: string,
  resourceId: string,
): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.purpose === "render" && payload.resourceId === resourceId;
  } catch {
    return false;
  }
}
