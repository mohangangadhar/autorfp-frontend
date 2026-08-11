import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppError } from "@/lib/api/error";

const { mutateAsync } = vi.hoisted(() => ({ mutateAsync: vi.fn() }));

vi.mock("@/lib/queries/users", () => ({
  useInviteUser: () => ({ mutateAsync, isPending: false }),
}));

import { InviteForm } from "./invite-form";

/**
 * jsdom lacks Pointer Events capture APIs that Radix Select triggers on
 * during option selection. Polyfill scoped to this suite so the RoleSelect
 * interaction works under jsdom.
 */
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

describe("InviteForm", () => {
  beforeEach(() => {
    patchPointerCapture();
    mutateAsync.mockReset();
  });

  it("invites a user with name, email and default viewer role", async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue({ id: "u_1" });
    render(<InviteForm />);

    await user.type(screen.getByLabelText(/Name/), "Alice Smith");
    await user.type(screen.getByLabelText(/Email/), "alice@acme.com");
    await user.click(screen.getByRole("button", { name: "Send invitation" }));

    await vi.waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        email: "alice@acme.com",
        name: "Alice Smith",
        role: "viewer",
      }),
    );
    expect(await screen.findByTestId("invite-success")).toBeInTheDocument();
    expect(screen.getByText(/Invitation sent to alice@acme.com/)).toBeInTheDocument();
  });

  it("assigns the selected role", async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue({ id: "u_1" });
    render(<InviteForm />);

    await user.type(screen.getByLabelText(/Name/), "Bob");
    await user.type(screen.getByLabelText(/Email/), "bob@acme.com");
    await user.click(screen.getByRole("combobox", { name: "Role" }));
    await user.click(await screen.findByRole("option", { name: "Organization admin" }));
    await user.click(screen.getByRole("button", { name: "Send invitation" }));

    await vi.waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        email: "bob@acme.com",
        name: "Bob",
        role: "org_admin",
      }),
    );
  });

  it("validates required fields before submitting", async () => {
    const user = userEvent.setup();
    render(<InviteForm />);

    await user.click(screen.getByRole("button", { name: "Send invitation" }));

    expect(await screen.findByTestId("invite-name-error")).toBeInTheDocument();
    expect(screen.getByTestId("invite-email-error")).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("maps a 409 duplicate email onto the email field", async () => {
    const user = userEvent.setup();
    mutateAsync.mockRejectedValue(
      new AppError({
        code: "CONFLICT",
        httpStatus: 409,
        userMessage: "USR-001: A user with this email already exists",
      }),
    );
    render(<InviteForm />);

    await user.type(screen.getByLabelText(/Name/), "Carol");
    await user.type(screen.getByLabelText(/Email/), "taken@acme.com");
    await user.click(screen.getByRole("button", { name: "Send invitation" }));

    expect(await screen.findByTestId("invite-email-error")).toBeInTheDocument();
    expect(screen.getByText("A user with this email has already been invited.")).toBeInTheDocument();
    expect(screen.queryByTestId("invite-success")).not.toBeInTheDocument();
  });

  it("shows a server error banner for non-conflict failures", async () => {
    const user = userEvent.setup();
    mutateAsync.mockRejectedValue(
      new AppError({ code: "INTERNAL", httpStatus: 500, userMessage: "Server hiccup" }),
    );
    render(<InviteForm />);

    await user.type(screen.getByLabelText(/Name/), "Dan");
    await user.type(screen.getByLabelText(/Email/), "dan@acme.com");
    await user.click(screen.getByRole("button", { name: "Send invitation" }));

    expect(await screen.findByTestId("invite-server-error")).toBeInTheDocument();
    expect(screen.getByText("Server hiccup")).toBeInTheDocument();
  });
});
