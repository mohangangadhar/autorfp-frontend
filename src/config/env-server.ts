import "server-only";
import { z } from "zod";
import { getClientEnv } from "./env";

/**
 * Server-only environment contract for BFF route handlers.
 *
 * These values are never exposed to the browser. Anything imported from
 * this module must stay server-side (Next route handlers, server components,
 * `proxy.ts`).
 */
const serverEnvSchema = z.object({
  BACKEND_API_URL: z.string().url().optional(),
  SESSION_COOKIE_NAME: z.string().min(1).default("__session"),
  SENTRY_DSN: z.string().default(""),
  SESSION_COOKIE_SECURE: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => {
      if (v !== undefined) return v === "true";
      // Secure flag only in production; local dev runs over http.
      return process.env.NODE_ENV === "production";
    }),
  REFRESH_COOKIE_MAX_AGE_DAYS: z.coerce.number().int().positive().default(7),
});

export interface ServerEnv {
  BACKEND_API_URL: string;
  SESSION_COOKIE_NAME: string;
  SENTRY_DSN: string;
  SESSION_COOKIE_SECURE: boolean;
  REFRESH_COOKIE_MAX_AGE_DAYS: number;
}

let cached: ServerEnv | undefined;

/** Parse (once) and return the validated server environment. */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const client = getClientEnv();
  const parsed = serverEnvSchema.parse(process.env);
  const serverEnv: ServerEnv = {
    BACKEND_API_URL: parsed.BACKEND_API_URL || client.NEXT_PUBLIC_API_URL,
    SESSION_COOKIE_NAME: parsed.SESSION_COOKIE_NAME,
    SENTRY_DSN: parsed.SENTRY_DSN,
    SESSION_COOKIE_SECURE: parsed.SESSION_COOKIE_SECURE,
    REFRESH_COOKIE_MAX_AGE_DAYS: parsed.REFRESH_COOKIE_MAX_AGE_DAYS,
  };
  cached = serverEnv;
  return cached;
}