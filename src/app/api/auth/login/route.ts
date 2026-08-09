import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { callBackend } from "@/lib/api/server";
import { cookies } from "next/headers";
import { setSessionCookie } from "@/lib/api/server/cookie";
import type { UserProfile } from "@/types/api";

/**
 * BFF login relay (authentication-design.md §1).
 * Browser → POST /api/auth/login {email,password} → backend
 * POST /api/v1/auth/login → sets httpOnly refresh cookie → returns
 * `{ user, access_token, expires_in }` (access held in client memory).
 */

export async function POST(request: NextRequest) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
  }

  const login = await callBackend("/api/v1/auth/login", {
    method: "POST",
    body: { email, password },
  });

  if (!login.ok) {
    const message = loginMessage(login.status, login.body);
    return NextResponse.json({ error: message }, { status: login.status });
  }

  const token = login.body as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  if (!token.access_token || !token.refresh_token) {
    return NextResponse.json({ error: "Unexpected token response." }, { status: 502 });
  }

  const me = await callBackend("/api/v1/auth/me", { token: token.access_token });
  if (!me.ok) {
    return NextResponse.json({ error: "Could not load the session profile." }, { status: 502 });
  }

  const store = await cookies();
  setSessionCookie(store, token.refresh_token);

  const user = me.body as UserProfile;
  return NextResponse.json({
    user,
    access_token: token.access_token,
    expires_in: token.expires_in ?? 900,
  });
}

function loginMessage(status: number, body: unknown): string {
  const record = body as Record<string, unknown>;
  const detail = record["detail"];
  if (typeof detail === "string") return detail;
  const title = record["title"];
  if (typeof title === "string") return title;
  if (status === 401) return "Invalid email or password.";
  if (status === 429) return "Too many sign-in attempts. Please wait a moment.";
  if (status === 403) return "This account is locked or disabled.";
  return "Sign-in failed. Please try again.";
}