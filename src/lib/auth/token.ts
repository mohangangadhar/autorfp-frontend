import "client-only";

/**
 * In-memory access token store (authentication-design.md §2).
 *
 * Access tokens live only in module memory — never localStorage,
 * sessionStorage, URL, or logs. On page load the session bootstrap
 * provisions a fresh access token through the BFF cookie relay.
 */

interface StoredToken {
  accessToken: string;
  expiresAt: number; // epoch ms
}

let current: StoredToken | null = null;

const SKEW_EXP_MS = 30_000; // refresh proactively at exp − 30 s

export function getAccessToken(): string | null {
  if (!current || isExpiredToken(current)) return null;
  return current.accessToken;
}

function isExpiredToken(token: StoredToken, now = Date.now()): boolean {
  return now >= token.expiresAt - SKEW_EXP_MS;
}

export function setAccessToken(accessToken: string, expiresInSec: number): void {
  current = {
    accessToken,
    expiresAt: Date.now() + expiresInSec * 1000,
  };
}

/** Minimal base64url payload decode for `exp` inspection (never a JWT-verify). */
export function decodeAccessExp(token: string): number | undefined {
  const parts = token.split(".");
  if (parts.length !== 3) return undefined;
  const payload = parts[1];
  if (payload === undefined) return undefined;
  try {
    const json = JSON.parse(base64UrlDecode(payload)) as { exp?: number };
    return typeof json.exp === "number" ? json.exp * 1000 : undefined;
  } catch {
    return undefined;
  }
}

function base64UrlDecode(input: string): string {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64.padEnd(Math.ceil(b64.length / 4) * 4, "=");
  try {
    return typeof atob === "function" ? atob(padded) : Buffer.from(padded, "base64").toString("utf8");
  } catch {
    return "";
  }
}

export function clearAccessToken(): void {
  current = null;
}