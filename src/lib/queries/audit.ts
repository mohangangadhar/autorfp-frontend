"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { normalizePaginated, type Paginated } from "@/lib/api/pagination";
import { auditFiltersToQuery } from "@/lib/audit/contract";
import type { AuditLogDto, AuditLogFilters, AuditStatsDto } from "@/types/api";

/**
 * Audit log server state (backend `app/api/routers/audit.py`).
 *
 * `/audit` and `/audit/stats` require `AUDIT_READ` (bit 15) — the frontend
 * mirrors that as the `admin.audit` capability. Export returns raw CSV text
 * (text/csv), so it bypasses JSON parsing.
 */

export const AUDIT_KEY = "audit";

export const auditListKey = (filters: AuditLogFilters = {}) =>
  [AUDIT_KEY, "list", filters] as const;

export const auditStatsKey = () => [AUDIT_KEY, "stats"] as const;

/** GET /audit — paginated audit events for the current org, normalized. */
export async function fetchAuditLog(filters: AuditLogFilters = {}): Promise<Paginated<AuditLogDto>> {
  const query = auditFiltersToQuery(filters);
  const result = await apiClient.get<unknown>(`/api/v1/audit${query ? `?${query}` : ""}`);
  return normalizePaginated<AuditLogDto>(result.data);
}

/** GET /audit/stats — audit summary statistics. */
export async function fetchAuditStats(): Promise<AuditStatsDto> {
  const result = await apiClient.get<AuditStatsDto>("/api/v1/audit/stats");
  return result.data;
}

/** GET /audit/export — CSV text of matching events (same filters). */
export async function exportAuditCsv(filters: AuditLogFilters = {}): Promise<{
  text: string;
  filename: string;
}> {
  const query = auditFiltersToQuery(filters);
  const result = await apiClient.get<string>(`/api/v1/audit/export${query ? `?${query}` : ""}`);
  return { text: result.data, filename: "audit_log.csv" };
}

/** Paginated audit log (server filters + pagination). */
export function useAuditLog(filters: AuditLogFilters = {}) {
  return useQuery({
    queryKey: auditListKey(filters),
    queryFn: () => fetchAuditLog(filters),
  });
}

/** Audit summary stats (admin dashboard / page header). */
export function useAuditStats() {
  return useQuery({
    queryKey: auditStatsKey(),
    queryFn: fetchAuditStats,
  });
}
