import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { callBackend } from "@/lib/api/server";
import { assertSafeOrigin } from "@/lib/api/csrf";
import type { UserProfile } from "@/types/api";

/**
 * BFF accept-invite relay (FE-FOUND-03, contract §7.1).
 * `POST /api/auth/accept-invite {token,password}` →
 * backend 200/400/409/410. The 410 "expired invite" maps to a dedicated
 * UI state on the accept-invite screen.
 */
export async function POST(request: NextRequest) {
  const origin = assertSafeOrigin(request);
  if (!origin.ok) {
    return NextResponse.json({ error: origin.reason }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const res = await callBackend("/api/v1/auth/accept-invite", { method: "POST", body });
  if (res.ok) {
    return NextResponse.json(res.body as UserProfile);
  }
  return NextResponse.json(res.body ?? { error: "Invite could not be accepted." }, {
    status: res.status === 0 ? 502 : res.status,
  });
}