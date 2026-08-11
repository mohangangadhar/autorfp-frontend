import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterBar } from "./filter-bar";

describe("FilterBar", () => {
  it("applies trimmed filters on submit", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<FilterBar initial={{}} onApply={onApply} />);

    await user.type(screen.getByLabelText("Action"), "  user.login ");
    await user.type(screen.getByLabelText("Actor"), "user_1");
    await user.click(screen.getByTestId("audit-apply-filters"));

    expect(onApply).toHaveBeenCalledWith({ action: "user.login", user_id: "user_1" });
  });

  it("seeds inputs from the active filters", () => {
    render(<FilterBar initial={{ action: "role.create", entity_type: "role" }} onApply={vi.fn()} />);
    expect(screen.getByLabelText("Action")).toHaveValue("role.create");
    expect(screen.getByLabelText("Resource type")).toHaveValue("role");
  });

  it("clears inputs and applies empty filters", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<FilterBar initial={{ action: "role.create" }} onApply={onApply} />);

    await user.click(screen.getByTestId("audit-clear-filters"));

    expect(screen.getByLabelText("Action")).toHaveValue("");
    expect(onApply).toHaveBeenCalledWith({});
  });
});
