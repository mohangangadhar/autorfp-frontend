import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppError } from "@/lib/api/error";
import { PERMISSION_BITS } from "@/lib/rbac/bitmap";
import type { RoleDto } from "@/types/api";

const { useRoles, useDeleteRole, useCreateRole, useUpdateRole } = vi.hoisted(() => ({
  useRoles: vi.fn(),
  useDeleteRole: vi.fn(),
  useCreateRole: vi.fn(),
  useUpdateRole: vi.fn(),
}));

vi.mock("@/lib/queries/roles", () => ({
  useRoles,
  useDeleteRole,
  useCreateRole,
  useUpdateRole,
}));

vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    can: (permission: string) => permission === "admin.read" || permission === "admin.write",
  }),
}));

import { RoleList } from "./role-list";

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

describe("RoleList LEES", () => {
  beforeEach(() => {
    useRoles.mockReset();
    useDeleteRole.mockReset();
    useCreateRole.mockReset();
    useUpdateRole.mockReset();
    useDeleteRole.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    useCreateRole.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    useUpdateRole.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  });

  it("shows a loading skeleton while fetching", () => {
    useRoles.mockReturnValue({ isPending: true, isError: false, isSuccess: false, data: undefined });
    render(<RoleList />);
    expect(screen.getByTestId("page-skeleton")).toBeInTheDocument();
  });

  it("shows the empty state when no roles exist", () => {
    useRoles.mockReturnValue({ isPending: false, isError: false, isSuccess: true, data: { items: [], total: 0 } });
    render(<RoleList />);
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });

  it("shows an error state with retry on failure", () => {
    const refetch = vi.fn();
    useRoles.mockReturnValue({ isPending: false, isError: true, isSuccess: false, error: new Error("boom"), refetch });
    render(<RoleList />);
    expect(screen.getByTestId("error-state")).toBeInTheDocument();
  });

  it("renders a table with permission counts and type badges", () => {
    useRoles.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: {
        items: [
          role({}),
          role({ id: "role_2", name: "Admin", description: null, is_predefined: true, permission_bitmap: (1 << 22) - 1 }),
        ],
        total: 2,
      },
    });
    render(<RoleList />);
    expect(screen.getByRole("table", { name: "Roles" })).toBeInTheDocument();
    expect(screen.getByText("Analyst")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByTestId("role-custom")).toBeInTheDocument();
    expect(screen.getByTestId("role-predefined")).toBeInTheDocument();
    // Analyst has 2 permissions; Admin has all 22
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("22")).toBeInTheDocument();
  });

  it("only offers Edit/Delete for custom roles (predefined are immutable)", () => {
    useRoles.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: {
        items: [
          role({}),
          role({ id: "role_2", name: "Admin", is_predefined: true }),
        ],
        total: 2,
      },
    });
    render(<RoleList />);
    expect(screen.getByRole("button", { name: "Edit Analyst" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete Analyst" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit Admin" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete Admin" })).not.toBeInTheDocument();
  });

  it("opens the editor for a new role", async () => {
    const user = userEvent.setup();
    useRoles.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { items: [], total: 0 },
    });
    render(<RoleList />);

    await user.click(screen.getByRole("button", { name: "New role" }));
    expect(screen.getByRole("heading", { name: "Create role" })).toBeInTheDocument();
  });

  it("opens the editor prefilled for an existing role", async () => {
    const user = userEvent.setup();
    useRoles.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { items: [role({})], total: 1 },
    });
    render(<RoleList />);

    await user.click(screen.getByRole("button", { name: "Edit Analyst" }));
    expect(screen.getByRole("heading", { name: "Edit Analyst" })).toBeInTheDocument();
  });

  it("deletes a custom role after confirming", async () => {
    const user = userEvent.setup();
    const deleteMutateAsync = vi.fn().mockResolvedValue(undefined);
    useDeleteRole.mockReturnValue({ mutateAsync: deleteMutateAsync, isPending: false });
    useRoles.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { items: [role({})], total: 1 },
    });
    render(<RoleList />);

    await user.click(screen.getByRole("button", { name: "Delete Analyst" }));
    expect(await screen.findByText("Delete Analyst?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Yes, delete role" }));

    await vi.waitFor(() => expect(deleteMutateAsync).toHaveBeenCalledWith("role_1"));
  });

  it("keeps the delete dialog open and shows an inline error on failure", async () => {
    const user = userEvent.setup();
    useDeleteRole.mockReturnValue({
      mutateAsync: vi.fn().mockRejectedValue(
        new AppError({ code: "INTERNAL", httpStatus: 500, userMessage: "Server hiccup" }),
      ),
      isPending: false,
    });
    useRoles.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { items: [role({})], total: 1 },
    });
    render(<RoleList />);

    await user.click(screen.getByRole("button", { name: "Delete Analyst" }));
    await user.click(await screen.findByRole("button", { name: "Yes, delete role" }));

    expect(await screen.findByTestId("role-delete-error")).toBeInTheDocument();
    expect(screen.getByText("Server hiccup")).toBeInTheDocument();
  });
});
