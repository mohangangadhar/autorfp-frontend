import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppError } from "@/lib/api/error";
import type { OrganizationDto } from "@/types/api";

const { mutateAsync } = vi.hoisted(() => ({ mutateAsync: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({ can: () => true }),
}));

vi.mock("@/lib/queries/organizations", () => ({
  useCreateOrganization: () => ({ mutateAsync, isPending: false }),
}));

import { OrganizationCreateWizard } from "./organization-create-wizard";

function mockOrg(): OrganizationDto {
  return {
    id: "org_01",
    name: "Acme Corporation",
    slug: "acme-corporation",
    domain: null,
    status: "provisioning",
    region: "us-east",
    data_retention_days: 365,
    config: {},
    created_at: "2026-08-11T00:00:00Z",
    updated_at: "2026-08-11T00:00:00Z",
  };
}

describe("OrganizationCreateWizard", () => {
  beforeEach(() => {
    mutateAsync.mockReset();
  });

  it("walks the four steps and submits the create request", async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue(mockOrg());

    render(<OrganizationCreateWizard />);

    // Step 1 — org identity
    await user.type(screen.getByLabelText(/Organization name/), "Acme Corporation");
    expect(await screen.findByLabelText(/Slug/)).toHaveValue("acme-corporation");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Step 2 — admin user
    await user.type(screen.getByLabelText(/Admin name/), "Ada Lovelace");
    await user.type(screen.getByLabelText(/Admin email/), "ada@acme.com");
    await user.type(screen.getByLabelText(/Admin password/), "supersecret");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Step 3 — tenant config defaults (no input required)
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Step 4 — review → confirm
    await user.click(screen.getByRole("button", { name: "Create organization" }));
    await user.click(screen.getByRole("button", { name: "Yes, create organization" }));

    await vi.waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    const payload = mutateAsync.mock.calls[0]?.[0] as { name: string; slug: string; admin: { email: string }; config: { thresholds: { coverage_threshold: number } } };
    expect(payload.name).toBe("Acme Corporation");
    expect(payload.slug).toBe("acme-corporation");
    expect(payload.admin.email).toBe("ada@acme.com");
    expect(payload.config.thresholds.coverage_threshold).toBe(80);

    expect(await screen.findByTestId("org-create-success")).toBeInTheDocument();
  });

  it("requires the admin step to be valid before continuing", async () => {
    const user = userEvent.setup();
    render(<OrganizationCreateWizard />);

    await user.type(screen.getByLabelText(/Organization name/), "Acme");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Step 2 left empty
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText("Enter the admin's name.")).toBeInTheDocument();
    expect(screen.getByText("Enter the admin's email.")).toBeInTheDocument();
    expect(screen.getByText("Password must be at least 8 characters.")).toBeInTheDocument();
  });

  it("maps a 409 conflict onto the name field", async () => {
    const user = userEvent.setup();
    mutateAsync.mockRejectedValue(
      new AppError({ code: "CONFLICT", httpStatus: 409, userMessage: "duplicate" }),
    );

    render(<OrganizationCreateWizard />);
    await user.type(screen.getByLabelText(/Organization name/), "Acme");
    await user.type(await screen.findByLabelText(/Slug/), "acme");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(screen.getByLabelText(/Admin name/), "Ada");
    await user.type(screen.getByLabelText(/Admin email/), "ada@acme.com");
    await user.type(screen.getByLabelText(/Admin password/), "supersecret");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Create organization" }));
    await user.click(screen.getByRole("button", { name: "Yes, create organization" }));

    expect(await screen.findByText("An organization with this name already exists.")).toBeInTheDocument();
    expect(mutateAsync).toHaveBeenCalledTimes(1);
  });

  it("requires a valid org name before leaving step 1", async () => {
    const user = userEvent.setup();
    render(<OrganizationCreateWizard />);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText("Enter an organization name.")).toBeInTheDocument();
  });
});