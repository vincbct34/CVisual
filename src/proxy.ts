import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { locales, defaultLocale, isLocale } from "@/lib/i18n/config";

// Gate on the refresh-token secret, not JWT_SECRET. JWT_SECRET also signs share
// and render tokens, so verifying the (client-settable, non-httpOnly)
// access_token cookie with it would let any share/render token pass as a session
// (token-type confusion). The refresh_token cookie is httpOnly + server-set and
// signed with a dedicated secret, so it is the trustworthy session signal here.
const JWT_REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET!,
);

// Paths are matched against the locale-stripped pathname (e.g. "/dashboard").
const protectedRoutes = ["/dashboard", "/editor", "/cover-letter", "/settings"];
const authRoutes = ["/login", "/register"];

/** Pick a locale from the cookie, then the Accept-Language header, else default. */
function detectLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get("locale")?.value;
  if (cookieLocale && isLocale(cookieLocale)) return cookieLocale;

  const accept = request.headers.get("accept-language");
  if (accept) {
    for (const part of accept.split(",")) {
      const tag = part.split(";")[0].trim().toLowerCase();
      const base = tag.split("-")[0];
      if (isLocale(base)) return base;
    }
  }
  return defaultLocale;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect bare (locale-less) paths to a locale-prefixed URL.
  const segments = pathname.split("/");
  const maybeLocale = segments[1];
  if (!isLocale(maybeLocale)) {
    const locale = detectLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  const locale = maybeLocale;
  const rest = "/" + segments.slice(2).join("/"); // locale-stripped path

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

  // Redirect authenticated users away from auth pages.
  if (
    authRoutes.some((route) => rest === route || rest.startsWith(`${route}/`))
  ) {
    if (isAuthenticated) {
      return NextResponse.redirect(
        new URL(`/${locale}/dashboard`, request.url),
      );
    }
    return NextResponse.next();
  }

  // Protect dashboard / editor / settings routes.
  if (
    protectedRoutes.some(
      (route) => rest === route || rest.startsWith(`${route}/`),
    )
  ) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except API routes, the headless render targets, Next
  // internals, metadata routes, and any file with an extension (static assets).
  matcher: [
    "/share/:path*",
    "/((?!api|render|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|opengraph-image|twitter-image|icons/|sw.js|.*\\.).*)",
  ],
};

export { locales };
