import "server-only";
import { cookies } from "next/headers";
import { getSessionCookieName } from "@/lib/api/server/cookie";

/**
 * Server-side session presence helpers for route guards. The BFF only
 * checks *presence* of the refresh cookie here — permission enforcement
 * is backend truth via data fetch (routing-design §2).
 */

export async function hasSessionCookie(): Promise<boolean> {
  const store = await cookies();
  return Boolean(store.get(getSessionCookieName())?.value);
}

export async function getSessionCookieValue(): Promise<string | null> {
  const store = await cookies();
  return store.get(getSessionCookieName())?.value ?? null;
}

export function isPublicAuthPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/accept-invite"
  );
}

export const PROTECTED_PREFIXES = ["/dashboard", "/projects", "/documents", "/knowledge", "/requirements", "/capabilities", "/evidence", "/compliance", "/risk", "/proposals", "/reviews", "/search", "/notifications", "/settings", "/admin"];
