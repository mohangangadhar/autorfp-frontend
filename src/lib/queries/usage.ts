"use client";

import { useQuery } from "@tanstack/react-query";
import type { AuditLogDto, AuditLogFilters } from "@/types/api";
import { fetchAuditLog, fetchAuditStats } from "@/lib/queries/audit";
import { usageRangeToDates, type UsageTimeRange } from "@/lib/usage/contract";

/**
 * Usage dashboard server state (US-001-04-02 / FE-AD-03).
 *
 * No usage-metering endpoint exists backend-side (BD-N), so trend data is
 * derived from the verified `/audit` list (date-windowed, paginated) and
 * KPIs from `/audit/stats`. Page gated on `admin.audit` (backend `AUDIT_READ`).
 */

export const USAGE_KEY = "usage";

/** Page size used for trend aggregation (audit `per_page` max is 100). */
export const TREND_PAGE_SIZE = 100;
/** Safety cap on pages fetched for a trend — a budgeted, degraded view. */
export const TREND_MAX_PAGES = 5;

export const usageStatsKey = () => [USAGE_KEY, "stats"] as const;

export const usageTrendKey = (range: UsageTimeRange, filters: AuditLogFilters = {}) =>
  [USAGE_KEY, "trend", { range, ...filters }] as const;

export interface UsageTrend {
  events: AuditLogDto[];
  /** Backend-reported total events in the window (may exceed `events.length`). */
  total: number;
  /** True when more pages exist beyond the cap (chart labels it as partial). */
  truncated: boolean;
}

/**
 * Fetch audit events inside the range window, aggregating up to
 * `TREND_MAX_PAGES` pages (the backend has no time-series endpoint).
 */
export async function fetchUsageTrend(
  range: UsageTimeRange,
  filters: AuditLogFilters = {},
): Promise<UsageTrend> {
  const { dateFrom, dateTo } = usageRangeToDates(range);
  const base: AuditLogFilters = { ...filters, date_from: dateFrom, date_to: dateTo };

  const first = await fetchAuditLog({ ...base, page: 1, perPage: TREND_PAGE_SIZE });
  const pagesToFetch = Math.min(first.totalPages, TREND_MAX_PAGES);

  const rest =
    pagesToFetch > 1
      ? await Promise.all(
          Array.from({ length: pagesToFetch - 1 }, (_, i) =>
            fetchAuditLog({ ...base, page: i + 2, perPage: TREND_PAGE_SIZE }),
          ),
        )
      : [];

  return {
    events: [first, ...rest].flatMap((page) => page.items),
    total: first.total,
    truncated: first.totalPages > pagesToFetch,
  };
}

/** KPI source — `/audit/stats` summary. */
export function useUsageStats() {
  return useQuery({
    queryKey: usageStatsKey(),
    queryFn: fetchAuditStats,
  });
}

/** Time-series source — date-windowed `/audit` events for the range. */
export function useUsageTrend(range: UsageTimeRange, filters: AuditLogFilters = {}) {
  return useQuery({
    queryKey: usageTrendKey(range, filters),
    queryFn: () => fetchUsageTrend(range, filters),
  });
}
