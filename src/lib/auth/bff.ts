import { runSingleFlight } from "@/lib/api/refresh";
import { clearAccessToken, getAccessToken, setAccessToken } from "@/lib/auth/token";
import type { SessionPayload, UserProfile } from "@/types/api";

/**
 * BFF auth relay client (authentication-design.md §1–3).
 * These calls go to same-origin Next route handlers which hold the
 * refresh cookie and talk to the backend. Never returns tokens to logs.
 */

interface LoginResult {
  user: UserProfile;
}

async function readJson(response: Response): Promise<{ ok: boolean; body: unknown; status: number }> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }
  return { ok: response.ok, body, status: response.status };
}

export async function bffLogin(email: string, password: string): Promise<LoginResult> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "same-origin",
  });
  const { ok, body } = await readJson(response);
  if (!ok) {
    const message =
      body && typeof body === "object" && "message" in body
        ? String((body as { message: unknown }).message)
        : "Sign-in failed. Please try again.";
    throw new Error(message);
  }
  return body as LoginResult;
}

export async function bffLogout(): Promise<void> {
  try {
    const accessToken = getAccessToken();
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
      headers: accessToken ? { authorization: `Bearer ${accessToken}` } : undefined,
    });
  } catch {
    // best-effort; the client clears local state regardless
  }
}

/**
 * Rotate the session through the BFF refresh route. Single-flight so
 * concurrent 401s share one rotation. Returns true on success.
 */
export function refreshSession(): Promise<boolean> {
  return runSingleFlight(async () => {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!response.ok) return false;
    const payload = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
    };
    if (!payload.access_token || typeof payload.expires_in !== "number") return false;
    setAccessToken(payload.access_token, payload.expires_in);
    return true;
  });
}

/** Session bootstrap: the BFF returns access + profile from the refresh cookie. */
export async function bffBootstrap(): Promise<SessionPayload> {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("No active session.");
  }
  return (await response.json()) as SessionPayload;
}

/** Terminate the session client-side: clear memory + redirect to /login. */
export function handleSessionExpired(nextPath?: string): void {
  clearAccessToken();
  const next = nextPath ? `&next=${encodeURIComponent(nextPath)}` : "";
  if (typeof window !== "undefined") {
    window.location.assign(`/login?reason=expired${next}`);
  }
}