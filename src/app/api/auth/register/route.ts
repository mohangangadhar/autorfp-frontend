import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { callBackend } from "@/lib/api/server";
import { assertSafeOrigin } from "@/lib/api/csrf";
import type { UserProfile } from "@/types/api";

/**
 * BFF self-service register relay (FE-FOUND-03, contract §7.1).
 * `POST /api/auth/register {email,password,name,organization_id}` →
 * backend 201/409. Mirrors the backend password-strength message.
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

  const res = await callBackend("/api/v1/auth/register", { method: "POST", body });
  if (res.status !== 201) {
    return NextResponse.json(res.body ?? { error: "Registration failed." }, {
      status: res.status === 0 ? 502 : res.status,
    });
  }

  // Registration returns a profile (201); no cookie is set — the user
  // signs in explicitly afterwards.
  return NextResponse.json(res.body as UserProfile, { status: 201 });
}