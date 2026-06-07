import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Gate on the refresh-token secret, not JWT_SECRET. JWT_SECRET also signs share
// and render tokens, so verifying the (client-settable, non-httpOnly)
// access_token cookie with it would let any share/render token pass as a session
// (token-type confusion). The refresh_token cookie is httpOnly + server-set and
// signed with a dedicated secret, so it is the trustworthy session signal here.
const JWT_REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET!,
);

const protectedRoutes = ["/dashboard", "/editor", "/cover-letter"];
const authRoutes = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // UX-only redirect gate. Real authz is enforced per-request by the API guards
  // (requireAuth / requireResume / requireCoverLetter) against the Bearer token.
  const refreshToken = request.cookies.get("refresh_token")?.value;

  let isAuthenticated = false;
  if (refreshToken) {
    try {
      await jwtVerify(refreshToken, JWT_REFRESH_SECRET);
      isAuthenticated = true;
    } catch {
      // Token invalid or expired
    }
  }

  // Redirect authenticated users away from auth pages
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Protect dashboard and editor routes
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/editor/:path*",
    "/cover-letter/:path*",
    "/login",
    "/register",
  ],
};
