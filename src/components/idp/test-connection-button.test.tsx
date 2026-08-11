import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppError } from "@/lib/api/error";
import type { IdpConfigDto, TestConnectionResponse } from "@/types/api";

const { mutateAsync } = vi.hoisted(() => ({ mutateAsync: vi.fn() }));

vi.mock("@/lib/queries/idp", () => ({
  useIdpTestConnection: () => ({ mutateAsync, isPending: false }),
}));

import { TestConnectionButton } from "./test-connection-button";

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

function result(partial: Partial<TestConnectionResponse>): TestConnectionResponse {
  return {
    success: true,
    message: "Handshake with the IdP succeeded.",
    status: "ok",
    checked_at: "2026-08-01T00:00:00Z",
    ...partial,
  };
}

describe("TestConnectionButton", () => {
  beforeEach(() => {
    mutateAsync.mockReset();
  });

  it("shows the success result inline after a successful test", async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue(result({}));
    render(<TestConnectionButton idp={idp({})} />);

    await user.click(screen.getByRole("button", { name: "Test connection" }));

    expect(await screen.findByTestId("test-connection-result")).toBeInTheDocument();
    expect(screen.getByText("Connection succeeded")).toBeInTheDocument();
    expect(screen.getByText("Handshake with the IdP succeeded.")).toBeInTheDocument();
    expect(mutateAsync).toHaveBeenCalledWith("idp_1");
  });

  it("shows the failure result with details", async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue(
      result({
        success: false,
        message: "Certificate mismatch.",
        details: { reason: "invalid_signature", issuer: "https://elsewhere.example.com" },
      }),
    );
    render(<TestConnectionButton idp={idp({})} />);

    await user.click(screen.getByRole("button", { name: "Test connection" }));

    expect(await screen.findByTestId("test-connection-result")).toBeInTheDocument();
    expect(screen.getByText("Connection failed")).toBeInTheDocument();
    expect(screen.getByTestId("test-connection-details")).toBeInTheDocument();
    expect(screen.getByText(/invalid_signature/)).toBeInTheDocument();
  });

  it("shows a danger banner when the call itself fails", async () => {
    const user = userEvent.setup();
    mutateAsync.mockRejectedValue(
      new AppError({ code: "INTERNAL", httpStatus: 500, userMessage: "Server hiccup" }),
    );
    render(<TestConnectionButton idp={idp({})} />);

    await user.click(screen.getByRole("button", { name: "Test connection" }));

    expect(await screen.findByTestId("test-connection-error")).toBeInTheDocument();
    expect(screen.getByText("Server hiccup")).toBeInTheDocument();
    expect(screen.queryByTestId("test-connection-result")).not.toBeInTheDocument();
  });
});
