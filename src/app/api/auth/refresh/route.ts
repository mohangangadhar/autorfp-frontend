import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { callBackend } from "@/lib/api/server";
import { cookies } from "next/headers";
import { getSessionCookieName, setSessionCookie } from "@/lib/api/server/cookie";
import { assertSafeOrigin } from "@/lib/api/csrf";

/**
 * BFF refresh relay (authentication-design.md §2).
 * Rotates the refresh cookie and returns a fresh access token.
 * Single-flight is handled client-side.
 */

export async function POST(request: NextRequest) {
  const origin = assertSafeOrigin(request);
  if (!origin.ok) {
    return NextResponse.json({ error: origin.reason }, { status: 403 });
  }

  const store = await cookies();
  const refreshToken = store.get(getSessionCookieName())?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: "No session." }, { status: 401 });
  }

  const res = await callBackend("/api/v1/auth/refresh", {
    method: "POST",
    body: { refresh_token: refreshToken },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Session refresh failed." }, { status: res.status });
  }

  const token = res.body as { access_token?: string; refresh_token?: string; expires_in?: number };
  if (!token.access_token || !token.refresh_token) {
    return NextResponse.json({ error: "Unexpected refresh response." }, { status: 502 });
  }

  setSessionCookie(store, token.refresh_token);
  return NextResponse.json({
    access_token: token.access_token,
    expires_in: token.expires_in ?? 900,
  });
}