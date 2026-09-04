import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "metrica-sovereign-legal-metrology-auth-token-key-2026"
);

const AUTH_COOKIE_NAME = "metrica_session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protected paths that require institutional authentication
  const isProtectedPath =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/lmo") ||
    pathname.startsWith("/owner") ||
    pathname.startsWith("/manufacturer");

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    // Redirect unauthenticated visitors to login
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;

    // RBAC Rule Enforcement
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      const redirectUrl = new URL("/login", req.url);
      redirectUrl.searchParams.set("error", "unauthorized_admin");
      return NextResponse.redirect(redirectUrl);
    }

    if (pathname.startsWith("/lmo") && role !== "LMO" && role !== "ADMIN") {
      const redirectUrl = new URL("/owner", req.url);
      return NextResponse.redirect(redirectUrl);
    }

    if (pathname.startsWith("/owner") && role !== "OWNER" && role !== "ADMIN") {
      // Officers can inspect, but other roles route to their home
      return NextResponse.next();
    }

    return NextResponse.next();
  } catch {
    // Invalid or expired token
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/admin/:path*", "/lmo/:path*", "/owner/:path*", "/manufacturer/:path*"],
};
