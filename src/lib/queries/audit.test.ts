import { beforeEach, describe, expect, it, vi } from "vitest";

const apiClient = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({ apiClient }));

import {
  AUDIT_KEY,
  auditListKey,
  auditStatsKey,
  exportAuditCsv,
  fetchAuditLog,
  fetchAuditStats,
} from "./audit";

const EVENT = {
  id: "event_1",
  organization_id: "org_1",
  user_id: "user_1",
  entity_type: "user",
  entity_id: "user_1",
  action: "user.login",
  changes: null,
  ip_address: "10.0.0.1",
  user_agent: null,
  created_at: "2026-08-01T12:00:00Z",
};

describe("audit API functions", () => {
  beforeEach(() => {
    apiClient.get.mockReset();
  });

  it("fetches the audit log via GET /api/v1/audit and normalizes pagination", async () => {
    apiClient.get.mockResolvedValue({
      data: { items: [EVENT], total: 1, page: 1, per_page: 25, total_pages: 1 },
    });
    const result = await fetchAuditLog();
    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/audit");
    expect(result).toEqual({ items: [EVENT], total: 1, page: 1, perPage: 25, totalPages: 1 });
  });

  it("serializes filters into the query string", async () => {
    apiClient.get.mockResolvedValue({ data: { items: [], total: 0 } });
    await fetchAuditLog({ action: "user.login", page: 2, sort_order: "asc" });
    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/audit?action=user.login&page=2&sort_order=asc");
  });

  it("fetches stats via GET /api/v1/audit/stats", async () => {
    apiClient.get.mockResolvedValue({
      data: {
        total_entries: 5,
        total_organizations: 1,
        actions_breakdown: [{ action: "user.login", count: 5 }],
        entity_type_breakdown: [{ entity_type: "user", count: 5 }],
      },
    });
    const result = await fetchAuditStats();
    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/audit/stats");
    expect(result.total_entries).toBe(5);
    expect(result.actions_breakdown[0]?.count).toBe(5);
  });

  it("exports CSV text via GET /api/v1/audit/export", async () => {
    apiClient.get.mockResolvedValue({ data: "id,action\n1,user.login\n" });
    const result = await exportAuditCsv();
    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/audit/export");
    expect(result.text).toContain("id,action");
    expect(result.filename).toBe("audit_log.csv");
  });

  it("exports CSV with the active filters", async () => {
    apiClient.get.mockResolvedValue({ data: "" });
    await exportAuditCsv({ entity_type: "user" });
    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/audit/export?entity_type=user");
  });

  it("derives stable query keys", () => {
    expect(auditListKey({ action: "x" })).toEqual([AUDIT_KEY, "list", { action: "x" }]);
    expect(auditStatsKey()).toEqual([AUDIT_KEY, "stats"]);
  });
});
