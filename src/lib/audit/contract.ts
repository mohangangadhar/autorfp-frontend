/**
 * Audit domain helpers (US-001-04-01).
 *
 * Frontend-side contract for `/api/v1/audit`, `/audit/stats` and
 * `/audit/export` (backend `app/api/routers/audit.py`). Only serialization
 * and display rules live here — the backend owns filter semantics.
 */
import type { AuditLogFilters } from "@/types/api";

export const AUDIT_PAGE_SIZE_DEFAULT = 25;
export const AUDIT_PAGE_SIZE_MAX = 100;

/**
 * Serialize audit filters into a query-string suffix (no leading `?`).
 * Empty/blank filters are omitted so the backend keeps its defaults
 * (sort: `created_at DESC`, page 1).
 */
export function auditFiltersToQuery(filters: AuditLogFilters = {}): string {
  const params = new URLSearchParams();

  if (filters.action && filters.action.trim()) params.set("action", filters.action.trim());
  if (filters.user_id && filters.user_id.trim()) params.set("user_id", filters.user_id.trim());
  if (filters.entity_type && filters.entity_type.trim()) {
    params.set("entity_type", filters.entity_type.trim());
  }
  if (filters.entity_id && filters.entity_id.trim()) params.set("entity_id", filters.entity_id.trim());
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);

  const page = filters.page ?? 1;
  const perPage = filters.perPage ?? AUDIT_PAGE_SIZE_DEFAULT;
  if (page > 1) params.set("page", String(page));
  if (perPage !== AUDIT_PAGE_SIZE_DEFAULT) params.set("per_page", String(perPage));

  if (filters.sort_by && filters.sort_by !== "created_at") {
    params.set("sort_by", filters.sort_by);
  }
  if (filters.sort_order && filters.sort_order !== "desc") {
    params.set("sort_order", filters.sort_order);
  }

  return params.toString();
}

/** True when the event was authored by the system (no actor user). */
export function isSystemEvent(userId: string | null | undefined): boolean {
  return !userId;
}

/** Compact actor label — "System" for system events, else a short id. */
export function formatActor(userId: string | null | undefined): string {
  if (isSystemEvent(userId)) return "System";
  return userId!.slice(0, 8);
}

/** Render a change payload value as plain text (XSS-safe, tables design §rules). */
export function formatChangeValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

/** Localized timestamp label for an ISO `created_at`. Falls back raw on parse error. */
export function formatEventTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
}
