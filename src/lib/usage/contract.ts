/**
 * Usage dashboard domain helpers (US-001-04-02 / FE-AD-03).
 *
 * The usage-metering endpoints (`/api/v1/usage/*`) are not implemented
 * backend-side and are not enumerated in the API contract (BD-N, see
 * FE-AD-03 §9), so this dashboard degrades to the available `/audit*`
 * endpoints. Only serialization/presentation rules live here — the backend
 * owns filter semantics.
 */
import type { AuditBreakdownItem, AuditLogDto, AuditStatsDto } from "@/types/api";

export type UsageTimeRange = "7d" | "30d" | "90d";

export const USAGE_TIME_RANGES: readonly UsageTimeRange[] = ["7d", "30d", "90d"];

export const USAGE_RANGE_DAYS: Record<UsageTimeRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export function isUsageTimeRange(value: string): value is UsageTimeRange {
  return (USAGE_TIME_RANGES as readonly string[]).includes(value);
}

/** Inclusive ISO date window for a time range (UTC-aligned days). */
export function usageRangeToDates(
  range: UsageTimeRange,
  now: Date = new Date(),
): { dateFrom: string; dateTo: string } {
  const from = new Date(now);
  from.setUTCHours(0, 0, 0, 0);
  from.setUTCDate(from.getUTCDate() - (USAGE_RANGE_DAYS[range] - 1));

  const to = new Date(now);
  to.setUTCHours(23, 59, 59, 999);

  return { dateFrom: from.toISOString(), dateTo: to.toISOString() };
}

export interface DayBucket {
  /** Local calendar day as `YYYY-MM-DD`. */
  date: string;
  count: number;
}

/** Bucket events by local calendar day (chronological). */
export function bucketByDay(events: AuditLogDto[]): DayBucket[] {
  const counts = new Map<string, number>();
  for (const event of events) {
    const day = toDayKey(event.created_at);
    if (day) counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Short axis label for a `YYYY-MM-DD` day (e.g. "Aug 3"). */
export function formatDayLabel(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(parsed);
}

export interface UsageSummary {
  totalEvents: number;
  organizations: number;
  topAction: { name: string; count: number } | null;
  topEntityType: { name: string; count: number } | null;
}

/** Map audit stats onto honest, label-compatible KPI cards. */
export function summarizeStats(stats: AuditStatsDto): UsageSummary {
  return {
    totalEvents: stats.total_entries,
    organizations: stats.total_organizations,
    topAction: topBreakdown(stats.actions_breakdown),
    topEntityType: topBreakdown(stats.entity_type_breakdown),
  };
}

function topBreakdown(list: AuditBreakdownItem[]): { name: string; count: number } | null {
  const first = list[0];
  if (!first) return null;
  const name = (first.action ?? first.entity_type ?? "—") as string;
  return { name, count: first.count };
}

function toDayKey(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
