import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PermissionDenied } from "@/components/auth/permission-denied";

describe("PermissionDenied", () => {
  it("renders a clear 403 message and home link", () => {
    render(<PermissionDenied />);
    expect(screen.getByRole("heading", { name: "Permission denied" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
    expect(screen.getByTestId("permission-denied")).toBeInTheDocument();
  });
});