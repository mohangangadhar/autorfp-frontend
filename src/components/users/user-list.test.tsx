import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { UserProfile } from "@/types/api";

const { useUsers } = vi.hoisted(() => ({ useUsers: vi.fn() }));

vi.mock("@/lib/queries/users", () => ({
  useUsers,
}));

vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    can: (permission: string) => permission === "admin.read" || permission === "admin.write",
  }),
}));

import { UserList } from "./user-list";

function user(partial: Partial<UserProfile>): UserProfile {
  return {
    id: "u_01",
    organization_id: "org_01",
    email: "alice@acme.com",
    name: "Alice",
    role: "viewer",
    is_active: true,
    last_login_at: null,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    ...partial,
  };
}

describe("UserList LEES", () => {
  beforeEach(() => {
    useUsers.mockReset();
  });

  it("shows a loading skeleton while fetching", () => {
    useUsers.mockReturnValue({ isPending: true, isError: false, isSuccess: false, data: undefined });
    render(<UserList />);
    expect(screen.getByTestId("page-skeleton")).toBeInTheDocument();
  });

  it("shows the empty state when no users exist", () => {
    useUsers.mockReturnValue({ isPending: false, isError: false, isSuccess: true, data: { items: [], total: 0 } });
    render(<UserList />);
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });

  it("shows an error state with retry on failure", () => {
    const refetch = vi.fn();
    useUsers.mockReturnValue({ isPending: false, isError: true, isSuccess: false, error: new Error("boom"), refetch });
    render(<UserList />);
    expect(screen.getByTestId("error-state")).toBeInTheDocument();
  });

  it("renders users with role capsules and Invited/Active status", () => {
    useUsers.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: {
        items: [
          user({}),
          user({ id: "u_02", name: "Bob", email: "bob@acme.com", role: "editor", is_active: false }),
          user({ id: "u_03", name: "Cara", email: "cara@acme.com", role: "org_admin" }),
        ],
        total: 3,
      },
    });
    render(<UserList />);
    expect(screen.getByRole("table", { name: "Team members" })).toBeInTheDocument();
    expect(screen.getAllByTestId("role-capsule")).toHaveLength(3);
    expect(screen.getByText("Viewer")).toBeInTheDocument();
    expect(screen.getByText("Editor")).toBeInTheDocument();
    expect(screen.getByText("Organization admin")).toBeInTheDocument();
    // 2 active + 1 invited
    expect(screen.getAllByText("Active")).toHaveLength(2);
    expect(screen.getAllByText("Invited")).toHaveLength(1);
    expect(screen.getByText("alice@acme.com")).toBeInTheDocument();
  });
});
