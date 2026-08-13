import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchAuditLog, fetchAuditStats } = vi.hoisted(() => ({
  fetchAuditLog: vi.fn(),
  fetchAuditStats: vi.fn(),
}));

vi.mock("@/lib/queries/audit", () => ({ fetchAuditLog, fetchAuditStats }));

import { USAGE_KEY, fetchUsageTrend, usageStatsKey, usageTrendKey } from "./usage";

const EVENT = {
  id: "e1",
  organization_id: "org_1",
  user_id: null,
  entity_type: "capability",
  entity_id: "cap_1",
  action: "create",
  changes: null,
  ip_address: null,
  user_agent: null,
  created_at: "2026-08-01T12:00:00Z",
};

describe("fetchUsageTrend", () => {
  beforeEach(() => {
    fetchAuditLog.mockReset();
  });

  it("fetches page 1 with the range window applied", async () => {
    fetchAuditLog.mockResolvedValue({ items: [EVENT], total: 1, page: 1, perPage: 100, totalPages: 1 });
    const result = await fetchUsageTrend("7d", { entity_type: "capability" });
    const filters = fetchAuditLog.mock.calls[0]?.[0];
    expect(filters).toMatchObject({ page: 1, perPage: 100, entity_type: "capability" });
    expect(filters.date_from).toBeTruthy();
    expect(filters.date_to).toBeTruthy();
    expect(result.events).toEqual([EVENT]);
    expect(result.total).toBe(1);
    expect(result.truncated).toBe(false);
  });

  it("aggregates up to TREND_MAX_PAGES pages", async () => {
    fetchAuditLog.mockResolvedValueOnce({
      items: [EVENT],
      total: 3,
      page: 1,
      perPage: 100,
      totalPages: 3,
    });
    fetchAuditLog.mockResolvedValue({ items: [{ ...EVENT, id: "e2" }], total: 3, page: 2, perPage: 100, totalPages: 3 });

    const result = await fetchUsageTrend("30d");
    expect(fetchAuditLog).toHaveBeenCalledTimes(3);
    expect(result.events.map((e) => e.id)).toEqual(["e1", "e2", "e2"]);
  });

  it("marks the trend truncated when more pages exist than the cap", async () => {
    fetchAuditLog.mockResolvedValue({ items: [EVENT], total: 999, page: 1, perPage: 100, totalPages: 10 });
    const result = await fetchUsageTrend("90d");
    expect(result.truncated).toBe(true);
  });
});

describe("usage query keys", () => {
  it("derives stable keys", () => {
    expect(usageStatsKey()).toEqual([USAGE_KEY, "stats"]);
    expect(usageTrendKey("30d", { entity_type: "user" })).toEqual([
      USAGE_KEY,
      "trend",
      { range: "30d", entity_type: "user" },
    ]);
  });
});
