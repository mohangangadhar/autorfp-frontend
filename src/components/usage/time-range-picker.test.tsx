import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TimeRangePicker } from "./time-range-picker";

describe("TimeRangePicker", () => {
  it("renders the three ranges with the active one pressed", () => {
    render(<TimeRangePicker value="30d" onChange={vi.fn()} />);
    expect(screen.getByRole("group", { name: "Time range" })).toBeInTheDocument();
    expect(screen.getByTestId("time-range-7d")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("time-range-30d")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("time-range-90d")).toHaveAttribute("aria-pressed", "false");
  });

  it("emits the selected range", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimeRangePicker value="7d" onChange={onChange} />);

    await user.click(screen.getByTestId("time-range-90d"));
    expect(onChange).toHaveBeenCalledWith("90d");
  });
});
