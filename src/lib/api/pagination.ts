/**
 * Pagination normalization (frontend-api-contract.md §4).
 *
 * Backend may return `{items,total,page,per_page,total_pages}` (offset) or
 * `{items,total}` (bare). Both normalize to `Paginated<T>`. Cursor-based
 * responses are remapped transparently when they appear.
 */

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface PageParams {
  page?: number;
  perPage?: number;
}

export const PAGE_SIZE_DEFAULT = 20;
export const PAGE_SIZE_MAX = 100;

/** Serialize pagination params to a query string suffix (no leading ?). */
export function pageParamsToQuery({ page = 1, perPage = PAGE_SIZE_DEFAULT }: PageParams): string {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (perPage !== PAGE_SIZE_DEFAULT) params.set("per_page", String(perPage));
  return params.toString();
}

/** Parse pagination params from a URLSearchParams instance. */
export function pageParamsFromQuery(params: URLSearchParams): PageParams {
  const rawPage = params.get("page");
  const rawPer = params.get("per_page");
  return {
    page: rawPage ? clamp(Number.parseInt(rawPage, 10), 1, Number.MAX_SAFE_INTEGER) : 1,
    perPage: rawPer ? clamp(Number.parseInt(rawPer, 10), 1, PAGE_SIZE_MAX) : PAGE_SIZE_DEFAULT,
  };
}

interface OffsetPayload<T> {
  items?: T[];
  total?: number;
  page?: number;
  per_page?: number;
  total_pages?: number;
}

interface BarePayload<T> {
  items?: T[];
  total?: number;
}

function isOffsetPayload<T>(raw: unknown): raw is OffsetPayload<T> {
  return typeof raw === "object" && raw !== null && "items" in raw && ("page" in raw || "per_page" in raw);
}

function normalizePage(rawPage: unknown, fallback: number): number {
  const n = Number(rawPage);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : fallback;
}

function normalizeTotal(rawTotal: unknown): number {
  const n = Number(rawTotal);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

/**
 * Normalize any backend list payload into `Paginated<T>`.
 * Accepts offset `{items,total,page,per_page,total_pages}` and bare
 * `{items,total}` shapes; cursor payloads with `items`+`next_cursor`
 * collapse to a single-page view.
 */
export function normalizePaginated<T>(raw: unknown): Paginated<T> {
  if (typeof raw !== "object" || raw === null) {
    return { items: [], total: 0, page: 1, perPage: PAGE_SIZE_DEFAULT, totalPages: 0 };
  }

  const payload = raw as OffsetPayload<T> & BarePayload<T>;
  const items = Array.isArray(payload.items) ? payload.items : [];
  const total = normalizeTotal(payload.total ?? items.length);

  if (isOffsetPayload<T>(raw)) {
    const perPage = normalizePage(payload.per_page, PAGE_SIZE_DEFAULT);
    const page = normalizePage(payload.page, 1);
    const totalPages = normalizePage(payload.total_pages, Math.ceil(total / perPage));
    return { items, total, page, perPage, totalPages };
  }

  // Bare {items,total} or cursor {items,next_cursor}
  const perPage = PAGE_SIZE_DEFAULT;
  return { items, total, page: 1, perPage, totalPages: Math.ceil(total / perPage) };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
