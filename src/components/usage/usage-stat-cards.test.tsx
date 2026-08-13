import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { UsageSummary } from "@/lib/usage/contract";
import { UsageStatCards } from "./usage-stat-cards";

describe("UsageStatCards", () => {
  it("renders four KPI cards with counts", () => {
    const summary: UsageSummary = {
      totalEvents: 33,
      organizations: 2,
      topAction: { name: "create", count: 6 },
      topEntityType: { name: "capability", count: 3 },
    };
    render(<UsageStatCards summary={summary} />);

    expect(screen.getByTestId("usage-stat-cards")).toBeInTheDocument();
    expect(screen.getByText("33")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("create")).toBeInTheDocument();
    expect(screen.getByText("capability")).toBeInTheDocument();
    expect(screen.getAllByText("6 events").length).toBeGreaterThan(0);
  });

  it("falls back to a dash for missing top buckets", () => {
    const summary: UsageSummary = {
      totalEvents: 0,
      organizations: 0,
      topAction: null,
      topEntityType: null,
    };
    render(<UsageStatCards summary={summary} />);
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });
});
