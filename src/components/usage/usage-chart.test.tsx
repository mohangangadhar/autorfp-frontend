import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DayBucket } from "@/lib/usage/contract";
import { UsageChart } from "./usage-chart";

const BUCKETS: DayBucket[] = [
  { date: "2026-08-01", count: 2 },
  { date: "2026-08-02", count: 5 },
];

describe("UsageChart", () => {
  it("renders the summary sentence and an accessible svg", () => {
    render(<UsageChart buckets={BUCKETS} total={7} truncated={false} />);
    expect(screen.getByTestId("usage-chart-summary")).toHaveTextContent("7 events across 2 days");
    const svg = screen.getByTestId("usage-chart-svg");
    expect(svg).toHaveAttribute("role", "img");
    expect(svg.getAttribute("aria-label")).toMatch(/peak 5/);
  });

  it("shows the empty state when there is no data", () => {
    render(<UsageChart buckets={[]} total={0} truncated={false} />);
    expect(screen.getByTestId("usage-chart-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("usage-chart-table-toggle")).not.toBeInTheDocument();
  });

  it("reveals the data-table text alternative on demand", async () => {
    const user = userEvent.setup();
    render(<UsageChart buckets={BUCKETS} total={7} truncated={false} />);

    await user.click(screen.getByTestId("usage-chart-table-toggle"));
    expect(screen.getByTestId("usage-chart-table")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "5" })).toBeInTheDocument();
  });

  it("notes when the trend is truncated", () => {
    render(<UsageChart buckets={BUCKETS} total={500} truncated />);
    expect(screen.getByTestId("usage-chart-truncated")).toHaveTextContent("partial");
  });
});
