import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppError } from "@/lib/api/error";
import { PERMISSION_BITS } from "@/lib/rbac/bitmap";
import type { RoleDto } from "@/types/api";

const { createMutateAsync, updateMutateAsync } = vi.hoisted(() => ({
  createMutateAsync: vi.fn(),
  updateMutateAsync: vi.fn(),
}));

vi.mock("@/lib/queries/roles", () => ({
  useCreateRole: () => ({ mutateAsync: createMutateAsync, isPending: false }),
  useUpdateRole: () => ({ mutateAsync: updateMutateAsync, isPending: false }),
}));

import { RoleEditor } from "./role-editor";

function role(partial: Partial<RoleDto>): RoleDto {
  return {
    id: "role_1",
    organization_id: "org_1",
    name: "Analyst",
    description: "Reads and edits documents",
    is_predefined: false,
    permission_bitmap: PERMISSION_BITS.DOCUMENT_READ | PERMISSION_BITS.DOCUMENT_WRITE,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    ...partial,
  };
}

describe("RoleEditor", () => {
  beforeEach(() => {
    createMutateAsync.mockReset();
    updateMutateAsync.mockReset();
  });

  it("creates a role with name, description and the selected permissions", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    createMutateAsync.mockResolvedValue(role({}));
    render(<RoleEditor open onOpenChange={onOpenChange} role={null} />);

    await user.type(screen.getByLabelText(/Role name/), "Analyst");
    await user.type(screen.getByLabelText(/Description/), "Reads documents");
    await user.click(screen.getByLabelText("Edit documents"));
    await user.click(screen.getByRole("button", { name: "Create role" }));

    await vi.waitFor(() =>
      expect(createMutateAsync).toHaveBeenCalledWith({
        name: "Analyst",
        description: "Reads documents",
        permission_bitmap: PERMISSION_BITS.DOCUMENT_WRITE,
      }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("sends null description when left blank", async () => {
    const user = userEvent.setup();
    createMutateAsync.mockResolvedValue(role({}));
    render(<RoleEditor open onOpenChange={() => undefined} role={null} />);

    await user.type(screen.getByLabelText(/Role name/), "Analyst");
    await user.click(screen.getByRole("button", { name: "Create role" }));

    await vi.waitFor(() =>
      expect(createMutateAsync).toHaveBeenCalledWith({
        name: "Analyst",
        description: null,
        permission_bitmap: 0,
      }),
    );
  });

  it("prefills an existing role and updates it on save", async () => {
    const user = userEvent.setup();
    updateMutateAsync.mockResolvedValue(role({}));
    render(<RoleEditor open onOpenChange={() => undefined} role={role({})} />);

    const nameInput = screen.getByLabelText(/Role name/) as HTMLInputElement;
    expect(nameInput).toHaveValue("Analyst");
    expect(screen.getByLabelText("View documents")).toBeChecked();

    await user.clear(nameInput);
    await user.type(nameInput, "Analyst II");
    await user.click(screen.getByRole("button", { name: "Save role" }));

    await vi.waitFor(() =>
      expect(updateMutateAsync).toHaveBeenCalledWith({
        id: "role_1",
        payload: {
          name: "Analyst II",
          description: "Reads and edits documents",
          permission_bitmap: PERMISSION_BITS.DOCUMENT_READ | PERMISSION_BITS.DOCUMENT_WRITE,
        },
      }),
    );
  });

  it("validates required fields before submitting", async () => {
    const user = userEvent.setup();
    render(<RoleEditor open onOpenChange={() => undefined} role={null} />);

    await user.click(screen.getByRole("button", { name: "Create role" }));

    expect(await screen.findByTestId("role-name-error")).toBeInTheDocument();
    expect(createMutateAsync).not.toHaveBeenCalled();
  });

  it("maps a 409 duplicate name onto the name field", async () => {
    const user = userEvent.setup();
    createMutateAsync.mockRejectedValue(
      new AppError({ code: "CONFLICT", httpStatus: 409, userMessage: "ROL-001: Name exists" }),
    );
    render(<RoleEditor open onOpenChange={() => undefined} role={null} />);

    await user.type(screen.getByLabelText(/Role name/), "Taken");
    await user.click(screen.getByRole("button", { name: "Create role" }));

    expect(await screen.findByTestId("role-name-error")).toBeInTheDocument();
    expect(screen.getByText("A role with this name already exists.")).toBeInTheDocument();
  });

  it("shows a server error banner for non-conflict failures", async () => {
    const user = userEvent.setup();
    createMutateAsync.mockRejectedValue(
      new AppError({ code: "INTERNAL", httpStatus: 500, userMessage: "Server hiccup" }),
    );
    render(<RoleEditor open onOpenChange={() => undefined} role={null} />);

    await user.type(screen.getByLabelText(/Role name/), "Analyst");
    await user.click(screen.getByRole("button", { name: "Create role" }));

    expect(await screen.findByTestId("role-server-error")).toBeInTheDocument();
    expect(screen.getByText("Server hiccup")).toBeInTheDocument();
  });
});
