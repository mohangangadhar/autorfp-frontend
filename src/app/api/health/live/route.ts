import { NextResponse } from "next/server";
import { getServerEnv } from "@/config/env-server";

/** Liveness probe (observability-design §5). */
export function GET() {
  return NextResponse.json({ status: "ok", service: "autorfp-frontend", ts: Date.now() });
}

void getServerEnv; // env parsed lazily by consumers