import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppError } from "@/lib/api/error";
import type { OrganizationDto } from "@/types/api";

const { mutateAsync } = vi.hoisted(() => ({ mutateAsync: vi.fn() }));
const { can } = vi.hoisted(() => ({ can: vi.fn() }));

vi.mock("@/lib/queries/organizations", () => ({
  useToggleOrgStatus: () => ({ mutateAsync, isPending: false }),
}));

vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({ can }),
}));

import { OrgStatusToggle } from "./org-status-toggle";

function org(partial: Partial<OrganizationDto>): OrganizationDto {
  return {
    id: "org_01",
    name: "Acme",
    slug: "acme",
    status: "active",
    settings: {},
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    ...partial,
  };
}

describe("OrgStatusToggle", () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    can.mockReset();
    can.mockReturnValue(true);
  });

  it("renders Suspend for an active org", () => {
    render(<OrgStatusToggle org={org({})} />);
    expect(screen.getByRole("button", { name: "Suspend" })).toBeInTheDocument();
  });

  it("renders Reactivate for a suspended org", () => {
    render(<OrgStatusToggle org={org({ status: "suspended" })} />);
    expect(screen.getByRole("button", { name: "Reactivate" })).toBeInTheDocument();
  });

  it("renders nothing for provisioning/archived orgs", () => {
    const { container } = render(<OrgStatusToggle org={org({ status: "provisioning" })} />);
    expect(container).toBeEmptyDOMElement();
    const { container: archived } = render(<OrgStatusToggle org={org({ status: "archived" })} />);
    expect(archived).toBeEmptyDOMElement();
  });

  it("renders nothing without admin.write", () => {
    can.mockReturnValue(false);
    render(<OrgStatusToggle org={org({})} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("suspends an org after confirming the consequences", async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue({});
    render(<OrgStatusToggle org={org({})} />);

    await user.click(screen.getByRole("button", { name: "Suspend" }));
    expect(
      await screen.findByText(/Access will be revoked and all workflows paused/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Yes, suspend organization" }));
    await vi.waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({ id: "org_01", status: "suspended" }),
    );
  });

  it("reactivates a suspended org", async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue({});
    render(<OrgStatusToggle org={org({ status: "suspended" })} />);

    await user.click(screen.getByRole("button", { name: "Reactivate" }));
    expect(await screen.findByText(/Access and workflows will be restored/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Yes, reactivate organization" }));
    await vi.waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({ id: "org_01", status: "active" }),
    );
  });

  it("shows an inline error and keeps the dialog open when the mutation fails", async () => {
    const user = userEvent.setup();
    mutateAsync.mockRejectedValue(
      new AppError({ code: "INTERNAL", httpStatus: 500, userMessage: "Server hiccup" }),
    );
    render(<OrgStatusToggle org={org({ status: "suspended" })} />);

    await user.click(screen.getByRole("button", { name: "Reactivate" }));
    await user.click(screen.getByRole("button", { name: "Yes, reactivate organization" }));

    expect(await screen.findByTestId("toggle-error")).toBeInTheDocument();
    expect(screen.getByText("Server hiccup")).toBeInTheDocument();
  });
});
