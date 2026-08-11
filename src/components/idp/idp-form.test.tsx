import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppError } from "@/lib/api/error";
import type { IdpConfigDto } from "@/types/api";

const { createMutateAsync, updateMutateAsync } = vi.hoisted(() => ({
  createMutateAsync: vi.fn(),
  updateMutateAsync: vi.fn(),
}));

vi.mock("@/lib/queries/idp", () => ({
  useCreateIdp: () => ({ mutateAsync: createMutateAsync, isPending: false }),
  useUpdateIdp: () => ({ mutateAsync: updateMutateAsync, isPending: false }),
}));

import { IdpForm } from "./idp-form";

function patchPointerCapture() {
  for (const method of ["hasPointerCapture", "setPointerCapture", "releasePointerCapture"] as const) {
    if (typeof (Element.prototype as unknown as Record<string, unknown>)[method] !== "function") {
      Object.defineProperty(Element.prototype, method, {
        value: method === "hasPointerCapture" ? () => false : () => undefined,
        configurable: true,
      });
    }
  }
  if (typeof (Element.prototype as unknown as Record<string, unknown>).scrollIntoView !== "function") {
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      value: () => undefined,
      configurable: true,
    });
  }
}

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

describe("IdpForm", () => {
  beforeEach(() => {
    patchPointerCapture();
    createMutateAsync.mockReset();
    updateMutateAsync.mockReset();
  });

  it("creates a SAML provider with the entered fields", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    createMutateAsync.mockResolvedValue(idp({}));
    render(<IdpForm open onOpenChange={onOpenChange} idp={null} />);

    await user.type(screen.getByLabelText(/Provider name/), "Okta");
    await user.type(screen.getByLabelText(/Issuer/), "https://okta.example.com");
    await user.click(screen.getByRole("button", { name: "Create provider" }));

    await vi.waitFor(() =>
      expect(createMutateAsync).toHaveBeenCalledWith({
        protocol: "saml",
        name: "Okta",
        issuer: "https://okta.example.com",
        metadata_url: null,
        certificate: null,
        attribute_mapping: {},
        enabled: true,
      }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("creates an OIDC provider when the protocol is switched", async () => {
    const user = userEvent.setup();
    createMutateAsync.mockResolvedValue(idp({ protocol: "oidc" }));
    render(<IdpForm open onOpenChange={() => undefined} idp={null} />);

    await user.click(screen.getByRole("combobox", { name: /Protocol/ }));
    await user.click(await screen.findByRole("option", { name: "OIDC" }));
    await user.type(screen.getByLabelText(/Provider name/), "Auth0");
    await user.type(screen.getByLabelText(/Issuer/), "https://auth0.example.com");
    await user.type(screen.getByLabelText(/Client ID/), "client_123");
    await user.type(screen.getByLabelText(/Client secret/), "s3cr3t");
    await user.click(screen.getByRole("button", { name: "Create provider" }));

    await vi.waitFor(() =>
      expect(createMutateAsync).toHaveBeenCalledWith({
        protocol: "oidc",
        name: "Auth0",
        issuer: "https://auth0.example.com",
        metadata_url: null,
        client_id: "client_123",
        client_secret: "s3cr3t",
        attribute_mapping: {},
        enabled: true,
      }),
    );
  });

  it("updates an existing provider and keeps the secret blank", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    updateMutateAsync.mockResolvedValue(idp({}));
    render(<IdpForm open onOpenChange={onOpenChange} idp={idp({})} />);

    expect(screen.getByRole("heading", { name: "Edit Okta" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Provider name/)).toHaveValue("Okta");

    await user.clear(screen.getByLabelText(/Provider name/));
    await user.type(screen.getByLabelText(/Provider name/), "Okta EU");
    await user.click(screen.getByRole("button", { name: "Save provider" }));

    await vi.waitFor(() =>
      expect(updateMutateAsync).toHaveBeenCalledWith({
        id: "idp_1",
        payload: {
          name: "Okta EU",
          issuer: "https://okta.example.com",
          metadata_url: null,
          certificate: null,
          attribute_mapping: { email: "email" },
          enabled: true,
        },
      }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("validates required fields before submitting", async () => {
    const user = userEvent.setup();
    render(<IdpForm open onOpenChange={() => undefined} idp={null} />);

    await user.click(screen.getByRole("button", { name: "Create provider" }));

    expect(await screen.findByTestId("idp-name-error")).toBeInTheDocument();
    expect(screen.getByTestId("idp-issuer-error")).toBeInTheDocument();
    expect(createMutateAsync).not.toHaveBeenCalled();
  });

  it("requires a client id and secret for a new OIDC provider", async () => {
    const user = userEvent.setup();
    render(<IdpForm open onOpenChange={() => undefined} idp={null} />);

    await user.click(screen.getByRole("combobox", { name: /Protocol/ }));
    await user.click(await screen.findByRole("option", { name: "OIDC" }));
    await user.type(screen.getByLabelText(/Provider name/), "Auth0");
    await user.type(screen.getByLabelText(/Issuer/), "https://auth0.example.com");
    await user.click(screen.getByRole("button", { name: "Create provider" }));

    expect(await screen.findByTestId("idp-client-id-error")).toBeInTheDocument();
    expect(screen.getByTestId("idp-client-secret-error")).toBeInTheDocument();
    expect(createMutateAsync).not.toHaveBeenCalled();
  });

  it("validates the pasted PEM certificate", async () => {
    const user = userEvent.setup();
    render(<IdpForm open onOpenChange={() => undefined} idp={null} />);

    await user.type(screen.getByLabelText(/Provider name/), "Okta");
    await user.type(screen.getByLabelText(/Issuer/), "https://okta.example.com");
    await user.type(screen.getByLabelText(/Signing certificate/), "not a pem");
    await user.click(screen.getByRole("button", { name: "Create provider" }));

    expect(await screen.findByTestId("cert-error")).toBeInTheDocument();
    expect(createMutateAsync).not.toHaveBeenCalled();
  });

  it("shows a server error banner when creation fails", async () => {
    const user = userEvent.setup();
    createMutateAsync.mockRejectedValue(
      new AppError({ code: "INTERNAL", httpStatus: 500, userMessage: "Server hiccup" }),
    );
    render(<IdpForm open onOpenChange={() => undefined} idp={null} />);

    await user.type(screen.getByLabelText(/Provider name/), "Okta");
    await user.type(screen.getByLabelText(/Issuer/), "https://okta.example.com");
    await user.click(screen.getByRole("button", { name: "Create provider" }));

    expect(await screen.findByTestId("idp-server-error")).toBeInTheDocument();
    expect(screen.getByText("Server hiccup")).toBeInTheDocument();
  });
});
