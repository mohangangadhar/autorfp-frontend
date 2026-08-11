import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppError } from "@/lib/api/error";
import type { AuditLogDto, AuditLogFilters, AuditStatsDto } from "@/types/api";

const { useAuditLog, useAuditStats, exportAuditCsv } = vi.hoisted(() => ({
  useAuditLog: vi.fn(),
  useAuditStats: vi.fn(),
  exportAuditCsv: vi.fn(),
}));

vi.mock("@/lib/queries/audit", () => ({ useAuditLog, useAuditStats, exportAuditCsv }));

const { useAuth } = vi.hoisted(() => ({ useAuth: vi.fn() }));

vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => useAuth(),
}));

import { AuditPage } from "./audit-page";

function event(partial: Partial<AuditLogDto>): AuditLogDto {
  return {
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
    ...partial,
  };
}

const STATS: AuditStatsDto = {
  total_entries: 3,
  total_organizations: 1,
  actions_breakdown: [],
  entity_type_breakdown: [],
};

function listData(items: AuditLogDto[] = [event({})]) {
  return {
    items,
    total: items.length,
    page: 1,
    perPage: 25,
    totalPages: Math.max(1, Math.ceil(items.length / 25)),
  };
}

describe("AuditPage LEES", () => {
  beforeEach(() => {
    useAuth.mockReset();
    useAuth.mockReturnValue({ can: (p: string) => p === "admin.audit" });
    useAuditLog.mockReset();
    useAuditStats.mockReset();
    exportAuditCsv.mockReset();
    useAuditStats.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: STATS,
    });
  });

  it("shows a permission-denied panel without admin.audit", () => {
    useAuth.mockReturnValue({ can: () => false });
    render(<AuditPage />);
    expect(screen.getByTestId("permission-denied")).toBeInTheDocument();
  });

  it("shows a loading skeleton while fetching", () => {
    useAuditLog.mockReturnValue({ isPending: true, isError: false, isSuccess: false, data: undefined });
    render(<AuditPage />);
    expect(screen.getByTestId("page-skeleton")).toBeInTheDocument();
  });

  it("shows an error state with retry", () => {
    const refetch = vi.fn();
    useAuditLog.mockReturnValue({
      isPending: false,
      isError: true,
      isSuccess: false,
      error: new AppError({ code: "INTERNAL", httpStatus: 500, userMessage: "Audit unavailable" }),
      refetch,
    });
    render(<AuditPage />);
    expect(screen.getByTestId("error-state")).toBeInTheDocument();
  });

  it("shows the empty state with a clear-filters action when filters are active", () => {
    useAuditLog.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: listData([]),
    });
    render(<AuditPage />);
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });

  it("renders the audit table and stats summary", () => {
    useAuditLog.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: listData([event({ action: "user.login" })]),
    });
    render(<AuditPage />);
    expect(screen.getByRole("table", { name: "Audit events" })).toBeInTheDocument();
    expect(screen.getByTestId("audit-stats")).toBeInTheDocument();
  });

  it("applies filters and resets the page to 1", async () => {
    const user = userEvent.setup();
    useAuditLog.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: listData([event({})]),
    });
    render(<AuditPage />);

    await user.type(screen.getByLabelText("Action"), "role.create");
    await user.click(screen.getByTestId("audit-apply-filters"));

    const applied = useAuditLog.mock.calls.at(-1)?.[0] as AuditLogFilters;
    expect(applied.action).toBe("role.create");
    expect(applied.page).toBe(1);
  });

  it("opens the event drawer from a table row", async () => {
    const user = userEvent.setup();
    useAuditLog.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: listData([event({ action: "user.login" })]),
    });
    render(<AuditPage />);

    await user.click(screen.getByTestId("audit-row"));
    expect(screen.getByTestId("event-drawer-details")).toBeInTheDocument();
  });
});
