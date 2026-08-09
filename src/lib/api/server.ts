import "server-only";
import { getServerEnv } from "@/config/env-server";

/**
 * Server-to-backend fetch helper for BFF route handlers (server-only).
 * Relays to the FastAPI origin at `BACKEND_API_URL`; returns parsed JSON
 * plus status without throwing so routes can map status → response.
 */

export interface BackendResult {
  status: number;
  ok: boolean;
  body: unknown;
}

const DEFAULT_TIMEOUT_MS = 15_000;

export async function callBackend(
  path: string,
  init: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<BackendResult> {
  const { BACKEND_API_URL } = getServerEnv();
  const method = init.method ?? "GET";
  const headers: Record<string, string> = { accept: "application/json" };

  let body: BodyInit | undefined;
  if (init.body !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(init.body);
  }
  if (init.token) headers["authorization"] = `Bearer ${init.token}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetch(new URL(path.replace(/^\/+/, ""), BACKEND_API_URL), {
      method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
      signal: controller.signal,
    });
    const text = await readText(response);
    let parsed: unknown;
    try {
      parsed = text === "" ? undefined : JSON.parse(text);
    } catch {
      parsed = text;
    }
    return { status: response.status, ok: response.ok, body: parsed };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}