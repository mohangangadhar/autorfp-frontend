import { NextResponse } from "next/server";
import { callBackend } from "@/lib/api/server";
import { cookies } from "next/headers";
import { getSessionCookieName, setSessionCookie } from "@/lib/api/server/cookie";
import type { SessionPayload, UserProfile } from "@/types/api";

/**
 * Session bootstrap (authentication-design.md §3).
 *
 * On page load the browser has no access token — only the refresh
 * cookie. This route rotates the cookie, mints an access token, loads
 * `/auth/me`, and returns `{ access_token, expires_in, user }`.
 */
export async function GET() {
  const store = await cookies();
  const refreshToken = store.get(getSessionCookieName())?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: "No session." }, { status: 401 });
  }

  const refresh = await callBackend("/api/v1/auth/refresh", {
    method: "POST",
    body: { refresh_token: refreshToken },
  });
  if (!refresh.ok) {
    return NextResponse.json({ error: "Session refresh failed." }, { status: refresh.status });
  }

  const token = refresh.body as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  if (!token.access_token || !token.refresh_token) {
    return NextResponse.json({ error: "Unexpected refresh response." }, { status: 502 });
  }
  setSessionCookie(store, token.refresh_token);

  const me = await callBackend("/api/v1/auth/me", { token: token.access_token });
  if (!me.ok) {
    return NextResponse.json({ error: "Could not load the session profile." }, { status: me.status });
  }

  const payload: SessionPayload = {
    access_token: token.access_token,
    expires_in: token.expires_in ?? 900,
    user: me.body as UserProfile,
  };
  return NextResponse.json(payload);
}