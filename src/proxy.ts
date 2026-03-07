import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Dashboard and app routes that should NOT be localized
const skipPrefixes = [
  "/dashboard",
  "/plan",
  "/activities",
  "/fitness",
  "/health",
  "/nutrition",
  "/calendar",
  "/zones",
  "/profile",
  "/settings",
  "/onboarding",
  "/admin",
  "/api",
];

function addSecurityHeaders(response: NextResponse) {
  response.headers.set("x-pathname", "");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pass pathname to server components via header
  const isSkipped = skipPrefixes.some((p) => pathname.startsWith(p));

  if (isSkipped) {
    const response = NextResponse.next();
    response.headers.set("x-pathname", pathname);
    addSecurityHeaders(response);
    return response;
  }

  // Run next-intl middleware for marketing/auth routes
  const response = intlMiddleware(request);
  addSecurityHeaders(response as NextResponse);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
