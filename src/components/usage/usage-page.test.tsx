import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppError } from "@/lib/api/error";
import type { AuditStatsDto } from "@/types/api";

const { useUsageStats, useUsageTrend } = vi.hoisted(() => ({
  useUsageStats: vi.fn(),
  useUsageTrend: vi.fn(),
}));

vi.mock("@/lib/queries/usage", () => ({ useUsageStats, useUsageTrend }));

const { useAuth } = vi.hoisted(() => ({ useAuth: vi.fn() }));

vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => useAuth(),
}));

// next/dynamic → render the chart directly (real chart tested separately).
vi.mock("next/dynamic", () => ({
  default: () => function DynamicStub() {
    return <div data-testid="usage-chart-stub" />;
  },
}));

import { UsagePage } from "./usage-page";

const STATS: AuditStatsDto = {
  total_entries: 33,
  total_organizations: 2,
  actions_breakdown: [{ action: "create", count: 6 }],
  entity_type_breakdown: [{ entity_type: "capability", count: 3 }],
};

describe("UsagePage LEES", () => {
  beforeEach(() => {
    useAuth.mockReset();
    useAuth.mockReturnValue({ can: (p: string) => p === "admin.audit" });
    useUsageStats.mockReset();
    useUsageTrend.mockReset();
    useUsageStats.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: STATS,
    });
    useUsageTrend.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { events: [], total: 0, truncated: false },
      refetch: vi.fn(),
    });
  });

  it("shows a permission-denied panel without admin.audit", () => {
    useAuth.mockReturnValue({ can: () => false });
    render(<UsagePage />);
    expect(screen.getByTestId("permission-denied")).toBeInTheDocument();
  });

  it("shows KPI skeletons while stats load", () => {
    useUsageStats.mockReturnValue({ isPending: true, isError: false, isSuccess: false, data: undefined });
    render(<UsagePage />);
    expect(screen.getByTestId("usage-stat-cards-skeleton")).toBeInTheDocument();
  });

  it("shows an error state with retry on failure", () => {
    const refetch = vi.fn();
    useUsageStats.mockReturnValue({
      isPending: false,
      isError: true,
      isSuccess: false,
      error: new AppError({ code: "INTERNAL", httpStatus: 500, userMessage: "Usage unavailable" }),
      refetch,
    });
    render(<UsagePage />);
    expect(screen.getByTestId("error-state")).toBeInTheDocument();
  });

  it("renders the KPI cards and the chart when data is ready", () => {
    useUsageTrend.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { events: [], total: 0, truncated: false },
      refetch: vi.fn(),
    });
    render(<UsagePage />);
    expect(screen.getByTestId("usage-stat-cards")).toBeInTheDocument();
    expect(screen.getByTestId("usage-chart-stub")).toBeInTheDocument();
  });

  it("defaults to the 30-day range and switches ranges", async () => {
    const user = userEvent.setup();
    render(<UsagePage />);
    expect(useUsageTrend).toHaveBeenCalledWith("30d");

    await user.click(screen.getByTestId("time-range-90d"));
    expect(useUsageTrend).toHaveBeenCalledWith("90d");
  });

  it("offers an export button for the current window", () => {
    render(<UsagePage />);
    expect(screen.getByTestId("audit-export-button")).toBeInTheDocument();
  });
});
