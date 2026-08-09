import { z } from "zod";

/**
 * Typed public environment contract.
 *
 * Only `NEXT_PUBLIC_*` values may appear here — anything referenced in a
 * Client Component gets statically inlined by Next.js. Server-only values
 * (secrets, backend URL, cookie names) live in `@/config/env-server`.
 *
 * Contract source: frontend/technical/api/frontend-api-contract.md §1.
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:8000"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SENTRY_DSN: z.string().default(""),
  NEXT_PUBLIC_ENABLE_REGISTRATION: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  NEXT_PUBLIC_ENABLE_SSO: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

let parsed: ClientEnv | undefined;

/** Parse (once) and return the validated public environment. */
export function getClientEnv(): ClientEnv {
  if (parsed) return parsed;
  parsed = clientEnvSchema.parse(process.env);
  return parsed;
}

/** Human-oriented label shown in shell chrome (i18n catalog owns translated copy). */
export function appName(): string {
  return "AUTORFP";
}

export function apiOrigin(): string {
  return getClientEnv().NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
}

export function appOrigin(): string {
  return getClientEnv().NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
}
