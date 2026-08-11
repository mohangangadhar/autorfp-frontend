import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { OrganizationDto } from "@/types/api";

const { useOrganizations } = vi.hoisted(() => ({ useOrganizations: vi.fn() }));
const { useToggleOrgStatus } = vi.hoisted(() => ({ useToggleOrgStatus: vi.fn() }));

vi.mock("@/lib/queries/organizations", () => ({
  useOrganizations,
  useToggleOrgStatus,
}));

vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    can: (permission: string) => permission === "admin.read" || permission === "admin.write",
  }),
}));

import { OrganizationsList } from "./organizations-list";

function org(partial: Partial<OrganizationDto>): OrganizationDto {
  return {
    id: "org_01",
    name: "Acme",
    slug: "acme",
    domain: null,
    status: "active",
    region: "us-east",
    data_retention_days: 365,
    config: {},
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    ...partial,
  };
}

describe("OrganizationsList LEES", () => {
  beforeEach(() => {
    useOrganizations.mockReset();
    useToggleOrgStatus.mockReset();
  });

  it("shows a loading skeleton while fetching", () => {
    useOrganizations.mockReturnValue({ isPending: true, isError: false, isSuccess: false, data: undefined });
    render(<OrganizationsList />);
    expect(screen.getByTestId("page-skeleton")).toBeInTheDocument();
  });

  it("shows the empty state when no organizations exist", () => {
    useOrganizations.mockReturnValue({ isPending: false, isError: false, isSuccess: true, data: { items: [], total: 0 } });
    render(<OrganizationsList />);
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });

  it("shows an error state with retry on failure", () => {
    const refetch = vi.fn();
    useOrganizations.mockReturnValue({ isPending: false, isError: true, isSuccess: false, error: new Error("boom"), refetch });
    render(<OrganizationsList />);
    expect(screen.getByTestId("error-state")).toBeInTheDocument();
  });

  it("renders a table with status chips and status toggles for each organization", () => {
    useToggleOrgStatus.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
    useOrganizations.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { items: [org({ status: "provisioning" }), org({ id: "org_02", name: "Beta", slug: "beta", status: "suspended" })], total: 2 },
    });
    render(<OrganizationsList />);
    expect(screen.getByRole("table", { name: "Organizations" })).toBeInTheDocument();
    expect(screen.getAllByTestId("status-chip")).toHaveLength(2);
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("provisioning")).toBeInTheDocument();
    expect(screen.getByText("suspended")).toBeInTheDocument();
    // provisioning has no lifecycle action; suspended does (reactivate)
    expect(screen.getByRole("button", { name: "Reactivate" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Suspend" })).not.toBeInTheDocument();
  });
});