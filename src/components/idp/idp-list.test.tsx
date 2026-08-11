import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppError } from "@/lib/api/error";
import type { IdpConfigDto } from "@/types/api";

const { useIdps, useDeleteIdp, useUpdateIdp, useIdpTestConnection } = vi.hoisted(() => ({
  useIdps: vi.fn(),
  useDeleteIdp: vi.fn(),
  useUpdateIdp: vi.fn(),
  useIdpTestConnection: vi.fn(),
}));

vi.mock("@/lib/queries/idp", () => ({
  useIdps,
  useDeleteIdp,
  useUpdateIdp,
  useIdpTestConnection,
}));

const { can } = vi.hoisted(() => ({ can: vi.fn() }));

vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({ can }),
}));

vi.mock("./idp-form", () => ({
  IdpForm: () => <div data-testid="idp-form-stub" />,
}));

vi.mock("./test-connection-button", () => ({
  TestConnectionButton: () => <button type="button">Test connection</button>,
}));

import { IdpList } from "./idp-list";

function idp(partial: Partial<IdpConfigDto>): IdpConfigDto {
  return {
    id: "idp_1",
    organization_id: "org_1",
    protocol: "saml",
    name: "Okta",
    issuer: "https://okta.example.com",
    metadata_url: null,
    certificate: null,
    client_id: null,
    client_secret: null,
    attribute_mapping: { email: "email" },
    enabled: true,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: null,
    ...partial,
  };
}

describe("IdpList", () => {
  beforeEach(() => {
    can.mockReset();
    can.mockReturnValue(true);
    useIdps.mockReset();
    useDeleteIdp.mockReset();
    useUpdateIdp.mockReset();
    useIdpTestConnection.mockReset();
    useDeleteIdp.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    useUpdateIdp.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  });

  it("shows a loading skeleton while fetching", () => {
    useIdps.mockReturnValue({ isPending: true, isError: false, isSuccess: false, data: undefined });
    render(<IdpList />);
    expect(screen.getByTestId("page-skeleton")).toBeInTheDocument();
  });

  it("shows the empty state with a CTA when no providers exist", () => {
    useIdps.mockReturnValue({ isPending: false, isError: false, isSuccess: true, data: [] });
    render(<IdpList />);
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByTestId("new-idp-button")).toBeInTheDocument();
  });

  it("shows an error state with retry on failure", () => {
    const refetch = vi.fn();
    useIdps.mockReturnValue({
      isPending: false,
      isError: true,
      isSuccess: false,
      error: new Error("boom"),
      refetch,
    });
    render(<IdpList />);
    expect(screen.getByTestId("error-state")).toBeInTheDocument();
  });

  it("renders a table with protocol badges and issuer", () => {
    useIdps.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [
        idp({}),
        idp({ id: "idp_2", protocol: "oidc", name: "Auth0", issuer: "https://auth0.example.com" }),
      ],
    });
    render(<IdpList />);
    expect(screen.getByRole("table", { name: "Providers" })).toBeInTheDocument();
    expect(screen.getByText("Okta")).toBeInTheDocument();
    expect(screen.getByText("Auth0")).toBeInTheDocument();
    expect(screen.getByText("SAML 2.0")).toBeInTheDocument();
    expect(screen.getByText("OIDC")).toBeInTheDocument();
  });

  it("opens the form for a new provider", async () => {
    const user = userEvent.setup();
    useIdps.mockReturnValue({ isPending: false, isError: false, isSuccess: true, data: [] });
    render(<IdpList />);

    await user.click(screen.getByTestId("new-idp-button"));
    expect(screen.getByTestId("idp-form-stub")).toBeInTheDocument();
  });

  it("deletes a provider after confirming", async () => {
    const user = userEvent.setup();
    const deleteMutateAsync = vi.fn().mockResolvedValue(undefined);
    useDeleteIdp.mockReturnValue({ mutateAsync: deleteMutateAsync, isPending: false });
    useIdps.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [idp({})],
    });
    render(<IdpList />);

    await user.click(screen.getByRole("button", { name: "Delete Okta" }));
    expect(await screen.findByText("Delete Okta?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Yes, delete provider" }));

    await vi.waitFor(() => expect(deleteMutateAsync).toHaveBeenCalledWith("idp_1"));
  });

  it("keeps the delete dialog open with an inline error on failure", async () => {
    const user = userEvent.setup();
    useDeleteIdp.mockReturnValue({
      mutateAsync: vi.fn().mockRejectedValue(
        new AppError({ code: "INTERNAL", httpStatus: 500, userMessage: "Server hiccup" }),
      ),
      isPending: false,
    });
    useIdps.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [idp({})],
    });
    render(<IdpList />);

    await user.click(screen.getByRole("button", { name: "Delete Okta" }));
    await user.click(await screen.findByRole("button", { name: "Yes, delete provider" }));

    expect(await screen.findByTestId("idp-delete-error")).toBeInTheDocument();
    expect(screen.getByText("Server hiccup")).toBeInTheDocument();
  });

  it("toggles a provider enabled state via the switch", async () => {
    const user = userEvent.setup();
    const updateMutateAsync = vi.fn().mockResolvedValue(idp({}));
    useUpdateIdp.mockReturnValue({ mutateAsync: updateMutateAsync, isPending: false });
    useIdps.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [idp({})],
    });
    render(<IdpList />);

    await user.click(screen.getByTestId("idp-enabled-toggle"));

    await vi.waitFor(() =>
      expect(updateMutateAsync).toHaveBeenCalledWith({ id: "idp_1", payload: { enabled: false } }),
    );
  });

  it("hides write actions when the viewer only has admin.read", () => {
    can.mockImplementation((permission: string) => permission === "admin.read");
    useIdps.mockReturnValue({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: [idp({})],
    });
    render(<IdpList />);

    expect(screen.queryByTestId("new-idp-button")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete Okta" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit Okta" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("idp-enabled-toggle")).not.toBeInTheDocument();
  });

  it("renders PermissionDenied without admin.read", () => {
    can.mockImplementation(() => false);
    render(<IdpList />);
    expect(screen.getByTestId("permission-denied")).toBeInTheDocument();
  });
});
