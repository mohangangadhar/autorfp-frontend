import { messages, type MessageKey } from "@/lib/i18n/messages";

/**
 * `t()` — minimal typed translation lookup used across the shell.
 * Interpolates `{token}` placeholders. Missing keys throw in development
 * (loud signal) and degrade to a visible `[key]` marker in production so
 * a dangling catalog entry never ships silently.
 */
export function t(key: MessageKey | (string & {}), params?: Record<string, string | number>): string {
  const value = lookup(key);
  if (value === undefined) {
    if (process.env.NODE_ENV === "development") {
      throw new Error(`Missing translation key: ${key}`);
    }
    return `[${key}]`;
  }
  return interpolate(String(value), params);
}

function lookup(key: string): string | undefined {
  const parts = key.split(".");
  let cursor: unknown = messages.en;
  for (const part of parts) {
    if (typeof cursor !== "object" || cursor === null) return undefined;
    cursor = (cursor as Record<string, unknown>)[part];
  }
  return typeof cursor === "string" ? cursor : undefined;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (acc, [name, value]) => acc.replaceAll(`{${name}}`, String(value)),
    template,
  );
}

/** Existing keys as a string array (allows safe lookups from dynamic data). */
export function hasMessageKey(key: string): boolean {
  return lookup(key) !== undefined;
}