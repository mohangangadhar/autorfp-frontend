import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppError } from "@/lib/api/error";
import type { OrganizationDto } from "@/types/api";

const { mutateAsync } = vi.hoisted(() => ({ mutateAsync: vi.fn() }));
const { can } = vi.hoisted(() => ({ can: vi.fn() }));

vi.mock("@/lib/queries/organizations", () => ({
  useArchiveOrg: () => ({ mutateAsync, isPending: false }),
}));

vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({ can }),
}));

import { ArchiveDialog } from "./archive-dialog";

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

describe("ArchiveDialog", () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    can.mockReset();
    can.mockReturnValue(true);
  });

  it("renders Archive for active, suspended and provisioning orgs", () => {
    const { rerender } = render(<ArchiveDialog org={org({})} />);
    expect(screen.getByRole("button", { name: "Archive" })).toBeInTheDocument();
    rerender(<ArchiveDialog org={org({ status: "suspended" })} />);
    expect(screen.getByRole("button", { name: "Archive" })).toBeInTheDocument();
    rerender(<ArchiveDialog org={org({ status: "provisioning" })} />);
    expect(screen.getByRole("button", { name: "Archive" })).toBeInTheDocument();
  });

  it("renders nothing for an archived org", () => {
    const { container } = render(<ArchiveDialog org={org({ status: "archived" })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing without admin.write", () => {
    can.mockReturnValue(false);
    render(<ArchiveDialog org={org({})} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("archives after confirming, with the compliance retention note", async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue({});
    render(<ArchiveDialog org={org({})} />);

    await user.click(screen.getByRole("button", { name: "Archive" }));
    expect(await screen.findByTestId("archive-retention-note")).toBeInTheDocument();
    expect(screen.getByText(/All data is retained per compliance requirements/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Yes, archive organization" }));
    await vi.waitFor(() => expect(mutateAsync).toHaveBeenCalledWith("org_01"));
  });

  it("shows an inline error and keeps the dialog open when the mutation fails", async () => {
    const user = userEvent.setup();
    mutateAsync.mockRejectedValue(
      new AppError({ code: "CONFLICT", httpStatus: 409, userMessage: "Already archived" }),
    );
    render(<ArchiveDialog org={org({})} />);

    await user.click(screen.getByRole("button", { name: "Archive" }));
    await user.click(screen.getByRole("button", { name: "Yes, archive organization" }));

    expect(await screen.findByTestId("archive-error")).toBeInTheDocument();
    expect(screen.getByText("Already archived")).toBeInTheDocument();
  });
});
