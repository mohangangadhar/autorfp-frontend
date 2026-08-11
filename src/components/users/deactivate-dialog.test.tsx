import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppError } from "@/lib/api/error";
import type { UserProfile } from "@/types/api";

const { mutateAsync } = vi.hoisted(() => ({ mutateAsync: vi.fn() }));
const { can } = vi.hoisted(() => ({ can: vi.fn() }));
const { currentUser } = vi.hoisted(() => ({ currentUser: vi.fn() }));

vi.mock("@/lib/queries/users", () => ({
  useToggleUserStatus: () => ({ mutateAsync, isPending: false }),
}));

vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({ can, user: currentUser() }),
}));

import { DeactivateDialog } from "./deactivate-dialog";

function user(partial: Partial<UserProfile>): UserProfile {
  return {
    id: "u_01",
    organization_id: "org_01",
    email: "alice@acme.com",
    name: "Alice",
    role: "editor",
    is_active: true,
    last_login_at: null,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    ...partial,
  };
}

describe("DeactivateDialog", () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    can.mockReset();
    currentUser.mockReset();
    can.mockReturnValue(true);
    currentUser.mockReturnValue({ id: "u_self" });
  });

  it("renders Deactivate for an active user", () => {
    render(<DeactivateDialog user={user({})} />);
    expect(screen.getByRole("button", { name: /Deactivate/ })).toBeInTheDocument();
  });

  it("renders Reactivate for an inactive user", () => {
    render(<DeactivateDialog user={user({ is_active: false })} />);
    expect(screen.getByRole("button", { name: /Reactivate/ })).toBeInTheDocument();
  });

  it("renders nothing for the current session user (backend rejects self-deactivation)", () => {
    currentUser.mockReturnValue({ id: "u_01" });
    const { container } = render(<DeactivateDialog user={user({})} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing without admin.write", () => {
    can.mockReturnValue(false);
    const { container } = render(<DeactivateDialog user={user({})} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("deactivates after confirming the consequences", async () => {
    const userEventCtx = userEvent.setup();
    mutateAsync.mockResolvedValue({});
    render(<DeactivateDialog user={user({})} />);

    await userEventCtx.click(screen.getByRole("button", { name: /Deactivate/ }));
    expect(
      await screen.findByText(/contributions are preserved and remain visible/),
    ).toBeInTheDocument();

    await userEventCtx.click(screen.getByRole("button", { name: "Yes, deactivate user" }));
    await vi.waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({ id: "u_01", isActive: true }),
    );
  });

  it("reactivates an inactive user", async () => {
    const userEventCtx = userEvent.setup();
    mutateAsync.mockResolvedValue({});
    render(<DeactivateDialog user={user({ is_active: false })} />);

    await userEventCtx.click(screen.getByRole("button", { name: /Reactivate/ }));
    expect(await screen.findByText(/Access and sign-in will be restored/)).toBeInTheDocument();

    await userEventCtx.click(screen.getByRole("button", { name: "Yes, reactivate user" }));
    await vi.waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({ id: "u_01", isActive: false }),
    );
  });

  it("shows an inline error and keeps the dialog open on failure", async () => {
    const userEventCtx = userEvent.setup();
    mutateAsync.mockRejectedValue(
      new AppError({ code: "INTERNAL", httpStatus: 500, userMessage: "Server hiccup" }),
    );
    render(<DeactivateDialog user={user({ is_active: false })} />);

    await userEventCtx.click(screen.getByRole("button", { name: /Reactivate/ }));
    await userEventCtx.click(screen.getByRole("button", { name: "Yes, reactivate user" }));

    expect(await screen.findByTestId("user-toggle-error")).toBeInTheDocument();
    expect(screen.getByText("Server hiccup")).toBeInTheDocument();
  });

  it("surfaces the last-active-admin guard as a friendly error", async () => {
    const userEventCtx = userEvent.setup();
    mutateAsync.mockRejectedValue(
      new AppError({
        code: "CONFLICT",
        httpStatus: 409,
        userMessage: "USR-004 Cannot deactivate the last active org_admin",
        developerMessage: "USR-004",
      }),
    );
    render(<DeactivateDialog user={user({})} />);

    await userEventCtx.click(screen.getByRole("button", { name: /Deactivate/ }));
    await userEventCtx.click(screen.getByRole("button", { name: "Yes, deactivate user" }));

    expect(
      await screen.findByText(/last active organization admin/),
    ).toBeInTheDocument();
  });
});
