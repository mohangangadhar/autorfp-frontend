import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { callBackend } from "@/lib/api/server";
import { cookies } from "next/headers";
import { clearSessionCookie } from "@/lib/api/server/cookie";
import { assertSafeOrigin } from "@/lib/api/csrf";

/**
 * BFF logout relay (authentication-design.md §1.5).
 * Invalidates the refresh hash backend-side (when the browser passes its
 * in-memory access token) and always clears the httpOnly cookie.
 */

export async function POST(request: NextRequest) {
  const origin = assertSafeOrigin(request);
  if (!origin.ok) {
    return NextResponse.json({ error: origin.reason }, { status: 403 });
  }

  const store = await cookies();
  const authHeader = request.headers.get("authorization");
  try {
    if (authHeader) {
      await callBackend("/api/v1/auth/logout", { method: "POST", token: authHeader.replace(/^Bearer\s+/i, "") });
    }
  } catch {
    // best-effort; the cookie is cleared regardless
  }
  clearSessionCookie(store);
  return NextResponse.json({ ok: true });
}