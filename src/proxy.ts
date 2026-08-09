import { NextResponse, type NextRequest } from "next/server";
import { getServerEnv } from "@/config/env-server";

/**
 * Next.js 16 Proxy (formerly middleware) — session *presence* gate only.
 *
 * routing-design §2: two-part protection, never redundant —
 *   1. this proxy redirects anonymous users to `/login?next=…`;
 *   2. the API enforces the real session/permission on every data call.
 */
export function proxy(request: NextRequest) {
  const { SESSION_COOKIE_NAME } = getServerEnv();
  const { pathname } = request.nextUrl;

  const isAuthPage =
    pathname === "/login" || pathname === "/register" || pathname === "/accept-invite";
  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);

  if (isAuthPage && hasSession) {
    const dashboard = request.nextUrl.clone();
    dashboard.pathname = "/dashboard";
    return NextResponse.redirect(dashboard);
  }

  if (!hasSession && isProtected(pathname)) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

function isProtected(pathname: string): boolean {
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/accept-invite" ||
    pathname === "/"
  ) {
    return false;
  }
  // Public paths and materialized assets are handled by the matcher;
  // anything else inside the app is protected by default.
  return pathname.startsWith("/dashboard") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/documents") ||
    pathname.startsWith("/knowledge") ||
    pathname.startsWith("/requirements") ||
    pathname.startsWith("/capabilities") ||
    pathname.startsWith("/evidence") ||
    pathname.startsWith("/compliance") ||
    pathname.startsWith("/risk") ||
    pathname.startsWith("/proposals") ||
    pathname.startsWith("/reviews") ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/admin");
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};