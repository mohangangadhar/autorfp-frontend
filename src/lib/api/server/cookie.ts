import "server-only";
import { getServerEnv } from "@/config/env-server";

/**
 * Refresh cookie (httpOnly) management for BFF route handlers
 * (authentication-design.md §1–2).
 */

export interface CookieStore {
  set(name: string, value: string, options?: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "strict" | "lax" | "none";
    path?: string;
    maxAge?: number;
  }): void;
  delete(name: string): void;
}

export function sessionCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  const env = getServerEnv();
  return {
    httpOnly: true,
    secure: env.SESSION_COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    maxAge: env.REFRESH_COOKIE_MAX_AGE_DAYS * 86_400,
  };
}

export function getSessionCookieName(): string {
  return getServerEnv().SESSION_COOKIE_NAME;
}

export function setSessionCookie(store: CookieStore, refreshToken: string): void {
  store.set(getSessionCookieName(), refreshToken, sessionCookieOptions());
}

export function clearSessionCookie(store: CookieStore): void {
  store.delete(getSessionCookieName());
}

export const REFRESH_TOKEN_FIELD = "refresh_token";