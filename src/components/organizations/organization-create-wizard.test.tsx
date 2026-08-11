import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppError } from "@/lib/api/error";

const { mutateAsync } = vi.hoisted(() => ({ mutateAsync: vi.fn() }));
const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({ can: () => true }),
}));

vi.mock("@/lib/queries/organizations", () => ({
  useCreateOrganization: () => ({ mutateAsync, isPending: false }),
}));

import { OrganizationCreateWizard } from "./organization-create-wizard";

describe("OrganizationCreateWizard", () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    push.mockReset();
  });

  it("walks the three steps and submits the create request", async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue({});

    render(<OrganizationCreateWizard />);

    // Step 1 — org identity
    await user.type(screen.getByLabelText(/Organization name/), "Acme Corporation");
    expect(await screen.findByLabelText(/Slug/)).toHaveValue("acme-corporation");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Step 2 — tenant config defaults (no input required)
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Step 3 — review → confirm
    await user.click(screen.getByRole("button", { name: "Create organization" }));
    await user.click(screen.getByRole("button", { name: "Yes, create organization" }));

    await vi.waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    const payload = mutateAsync.mock.calls[0]?.[0] as {
      name: string;
      slug: string;
      settings: { thresholds: { coverage_threshold: number } };
    };
    expect(payload.name).toBe("Acme Corporation");
    expect(payload.slug).toBe("acme-corporation");
    expect(payload.settings.thresholds.coverage_threshold).toBe(80);

    await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/admin/organizations"));
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
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Create organization" }));
    await user.click(screen.getByRole("button", { name: "Yes, create organization" }));

    expect(
      await screen.findByText("An organization with this name already exists."),
    ).toBeInTheDocument();
    expect(mutateAsync).toHaveBeenCalledTimes(1);
  });

  it("requires a valid org name before leaving step 1", async () => {
    const user = userEvent.setup();
    render(<OrganizationCreateWizard />);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText("Enter an organization name.")).toBeInTheDocument();
  });
});
