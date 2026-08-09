import "server-only";

/**
 * Same-site request guard for mutating BFF routes (authentication-design
 * §7 CSRF hardening). Rejects cross-origin mutating calls while staying
 * tolerant of clients that omit the headers (e.g. older proxies).
 */

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

interface GuardResult {
  ok: boolean;
  reason?: string;
}

export function assertSafeOrigin(request: Request): GuardResult {
  if (!MUTATING_METHODS.has(request.method.toUpperCase())) {
    return { ok: true };
  }

  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "none") {
    return { ok: false, reason: `blocked sec-fetch-site=${secFetchSite}` };
  }

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const host = request.headers.get("host");
      const originHost = new URL(origin).host;
      if (host && originHost !== host) {
        return { ok: false, reason: `blocked origin=${origin}` };
      }
    } catch {
      return { ok: false, reason: "invalid origin" };
    }
  }

  return { ok: true };
}