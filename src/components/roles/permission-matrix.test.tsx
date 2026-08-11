import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import {
  PERMISSION_BITS,
  PERMISSION_GROUPS,
  type PermissionBitName,
} from "@/lib/rbac/bitmap";
import { PermissionMatrix } from "./permission-matrix";

/** Stateful harness — the matrix is a controlled component, so the test must
 *  re-render with the new bitmap between interactions. */
function Harness({ onChange }: { onChange?: (bitmap: number) => void }) {
  const [bitmap, setBitmap] = React.useState(PERMISSION_BITS.DOCUMENT_READ);
  return (
    <PermissionMatrix
      bitmap={bitmap}
      onChange={(next) => {
        setBitmap(next);
        onChange?.(next);
      }}
    />
  );
}

function allGroups() {
  return PERMISSION_GROUPS;
}

function totalPermissions() {
  return allGroups().reduce((sum, group) => sum + group.permissions.length, 0);
}

describe("PermissionMatrix", () => {
  it("renders one group per module and a checkbox per permission", () => {
    render(<PermissionMatrix bitmap={0} onChange={() => undefined} />);
    expect(screen.getAllByTestId("permission-group")).toHaveLength(allGroups().length);
    const inputs = screen.getAllByRole("checkbox");
    // 1 group select-all per group + 1 checkbox per permission
    expect(inputs).toHaveLength(allGroups().length + totalPermissions());
  });

  it("reflects the given bitmap as checked boxes", () => {
    render(
      <PermissionMatrix bitmap={PERMISSION_BITS.DOCUMENT_READ | PERMISSION_BITS.USER_WRITE} onChange={() => undefined} />,
    );
    expect(screen.getByLabelText("View documents")).toBeChecked();
    expect(screen.getByLabelText("Manage users")).toBeChecked();
    expect(screen.getByLabelText("View requirements")).not.toBeChecked();
  });

  it("emits a new bitmap when a permission is toggled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.click(screen.getByLabelText("Edit documents"));
    expect(onChange).toHaveBeenLastCalledWith(PERMISSION_BITS.DOCUMENT_READ | PERMISSION_BITS.DOCUMENT_WRITE);

    await user.click(screen.getByLabelText("View documents"));
    expect(onChange).toHaveBeenLastCalledWith(PERMISSION_BITS.DOCUMENT_WRITE);
  });

  it("group select-all toggles every permission in the group", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PermissionMatrix bitmap={0} onChange={onChange} />);

    const group = allGroups()[0]!; // Documents
    await user.click(screen.getByLabelText("Documents"));

    const expected = group.permissions.reduce(
      (acc, name) => acc | PERMISSION_BITS[name],
      0,
    ) as number;
    expect(onChange).toHaveBeenLastCalledWith(expected);
  });

  it("marks a partially-selected group as indeterminate", () => {
    render(<PermissionMatrix bitmap={PERMISSION_BITS.DOCUMENT_READ} onChange={() => undefined} />);
    const group = screen.getByLabelText("Documents") as HTMLInputElement;
    expect(group).toHaveProperty("indeterminate", true);
    expect(group).toHaveAttribute("aria-checked", "mixed");
  });

  it("marks a fully-selected group as checked, not indeterminate", () => {
    render(
      <PermissionMatrix
        bitmap={PERMISSION_BITS.DOCUMENT_READ | PERMISSION_BITS.DOCUMENT_WRITE}
        onChange={() => undefined}
      />,
    );
    const group = screen.getByLabelText("Documents") as HTMLInputElement;
    expect(group).toHaveProperty("indeterminate", false);
    expect(group).toBeChecked();
  });

  it("disables every control when disabled (predefined roles)", () => {
    render(<PermissionMatrix bitmap={0} onChange={() => undefined} disabled />);
    const inputs = screen.getAllByRole("checkbox");
    expect(inputs.length).toBeGreaterThan(0);
    for (const input of inputs) expect(input).toBeDisabled();
  });

  it("exposes each permission row via data-permission for testing/automation", () => {
    const { container } = render(<PermissionMatrix bitmap={0} onChange={() => undefined} />);
    const perms = allGroups().flatMap((group) => group.permissions) as PermissionBitName[];
    for (const name of perms) {
      const row = container.querySelector(`[data-permission="${name}"]`);
      expect(row).not.toBeNull();
    }
  });
});
