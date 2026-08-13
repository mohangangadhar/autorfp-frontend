import { describe, expect, it } from "vitest";
import type { AuditLogDto, AuditStatsDto } from "@/types/api";
import {
  USAGE_RANGE_DAYS,
  bucketByDay,
  formatDayLabel,
  isUsageTimeRange,
  summarizeStats,
  usageRangeToDates,
} from "./contract";

function event(partial: Partial<AuditLogDto>): AuditLogDto {
  return {
    id: "e1",
    organization_id: "org_1",
    user_id: null,
    entity_type: "capability",
    entity_id: "cap_1",
    action: "create",
    changes: null,
    ip_address: null,
    user_agent: null,
    created_at: new Date(2026, 7, 3, 12).toISOString(),
    ...partial,
  };
}

describe("usageRangeToDates", () => {
  it("returns an inclusive UTC window ending today", () => {
    const now = new Date("2026-08-10T10:00:00Z");
    const { dateFrom, dateTo } = usageRangeToDates("7d", now);
    expect(dateFrom).toBe("2026-08-04T00:00:00.000Z");
    expect(dateTo).toBe("2026-08-10T23:59:59.999Z");
  });

  it("uses the day count from the range map", () => {
    const now = new Date("2026-08-10T10:00:00Z");
    expect(usageRangeToDates("30d", now).dateFrom).toBe("2026-07-12T00:00:00.000Z");
    expect(usageRangeToDates("90d", now).dateFrom).toBe("2026-05-13T00:00:00.000Z");
    expect(USAGE_RANGE_DAYS["7d"]).toBe(7);
  });
});

describe("isUsageTimeRange", () => {
  it("accepts only known ranges", () => {
    expect(isUsageTimeRange("7d")).toBe(true);
    expect(isUsageTimeRange("30d")).toBe(true);
    expect(isUsageTimeRange("90d")).toBe(true);
    expect(isUsageTimeRange("1y")).toBe(false);
  });
});

describe("bucketByDay", () => {
  it("buckets events by local calendar day, chronologically", () => {
    const day1 = new Date(2026, 7, 1, 9).toISOString();
    const day1Late = new Date(2026, 7, 1, 22).toISOString();
    const day2 = new Date(2026, 7, 2, 9).toISOString();
    const buckets = bucketByDay([
      event({ created_at: day2 }),
      event({ created_at: day1 }),
      event({ created_at: day1Late }),
    ]);
    expect(buckets).toEqual([
      { date: "2026-08-01", count: 2 },
      { date: "2026-08-02", count: 1 },
    ]);
  });

  it("skips unparseable timestamps", () => {
    expect(bucketByDay([event({ created_at: "not-a-date" })])).toEqual([]);
  });
});

describe("formatDayLabel", () => {
  it("renders a short month/day label", () => {
    const label = formatDayLabel("2026-08-03");
    expect(label).toMatch(/Aug/);
    expect(label).toMatch(/3/);
  });

  it("falls back to the raw date on parse failure", () => {
    expect(formatDayLabel("nope")).toBe("nope");
  });
});

describe("summarizeStats", () => {
  const stats: AuditStatsDto = {
    total_entries: 33,
    total_organizations: 2,
    actions_breakdown: [
      { action: "create", count: 6 },
      { action: "approve", count: 3 },
    ],
    entity_type_breakdown: [
      { entity_type: "capability", count: 3 },
      { entity_type: "evidence", count: 6 },
    ],
  };

  it("maps totals and top buckets", () => {
    const summary = summarizeStats(stats);
    expect(summary.totalEvents).toBe(33);
    expect(summary.organizations).toBe(2);
    expect(summary.topAction).toEqual({ name: "create", count: 6 });
    expect(summary.topEntityType).toEqual({ name: "capability", count: 3 });
  });

  it("returns null top buckets when breakdowns are empty", () => {
    const summary = summarizeStats({ total_entries: 0, total_organizations: 0, actions_breakdown: [], entity_type_breakdown: [] });
    expect(summary.topAction).toBeNull();
    expect(summary.topEntityType).toBeNull();
  });
});
