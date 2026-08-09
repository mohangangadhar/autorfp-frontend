import { z } from "zod";
import { PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX } from "@/lib/api/pagination";

/**
 * URL state codecs (state-management-design §6). Every list screen
 * derives its data query key from `searchParams` through a typed codec.
 * Write side uses a canonical form: empty/falsey values are dropped.
 */

const intIn = (min: number, max: number) =>
  z.coerce.number().int().min(min).max(max);

const paginationSchema = z.object({
  page: intIn(1, 10_000).default(1),
  perPage: intIn(1, PAGE_SIZE_MAX).default(PAGE_SIZE_DEFAULT),
});

export interface PaginationParams {
  page: number;
  perPage: number;
}

/** `?page=2&per_page=20` → `{page:2, perPage:20}` (defaults when absent). */
export function decodePagination(params: URLSearchParams): PaginationParams {
  const raw = {
    page: params.get("page") ?? undefined,
    perPage: params.get("per_page") ?? undefined,
  };
  return paginationSchema.parse(raw);
}

/** `{page, perPage}` → `URLSearchParams` (canonical: page=1 & default per_page dropped). */
export function encodePagination({ page, perPage }: PaginationParams): URLSearchParams {
  const qs = new URLSearchParams();
  if (page > 1) qs.set("page", String(page));
  if (perPage !== PAGE_SIZE_DEFAULT) qs.set("per_page", String(perPage));
  return qs;
}

const tabSchema = z.string().min(1).catch("");

/** `?tab=requirements` → tab name (undefined when absent). */
export function decodeTab(params: URLSearchParams): string | undefined {
  const value = params.get("tab");
  if (value === null) return undefined;
  const parsed = tabSchema.parse(value);
  return parsed === "" ? undefined : parsed;
}

/** Simple generic filter decoder — unknown keys are kept as `q`. */
export function decodeFilters<T extends Record<string, string>>(
  params: URLSearchParams,
  known: readonly (keyof T & string)[],
): T {
  const out: Record<string, string> = {};
  for (const key of known) {
    const value = params.get(key);
    if (value !== null && value !== "") out[key] = value;
  }
  return out as T;
}

/** Encode filters, dropping empty values (canonical form). */
export function encodeFilters(filters: Record<string, string | undefined>): URLSearchParams {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") qs.set(key, value);
  }
  return qs;
}

/** Merge all encoders into a single URLSearchParams. */
export function mergeSearch(...parts: (URLSearchParams | undefined)[]): URLSearchParams {
  const merged = new URLSearchParams();
  for (const part of parts) {
    if (!part) continue;
    for (const [key, value] of part.entries()) merged.set(key, value);
  }
  return merged;
}