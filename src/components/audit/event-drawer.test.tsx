import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { AuditLogDto } from "@/types/api";
import { EventDrawer } from "./event-drawer";

function event(partial: Partial<AuditLogDto>): AuditLogDto {
  return {
    id: "event_1",
    organization_id: "org_1",
    user_id: "user_1",
    entity_type: "user",
    entity_id: "user_1",
    action: "user.login",
    changes: { status: "active" },
    ip_address: "10.0.0.1",
    user_agent: "Mozilla/5.0",
    created_at: "2026-08-01T12:00:00Z",
    ...partial,
  };
}

describe("EventDrawer", () => {
  it("renders nothing when closed", () => {
    const { container } = render(<EventDrawer event={event({})} open={false} onOpenChange={vi.fn()} />);
    expect(container).not.toHaveTextContent("user.login");
  });

  it("surfaces every immutable event field", () => {
    render(<EventDrawer event={event({})} open onOpenChange={vi.fn()} />);

    expect(screen.getAllByText("user.login").length).toBeGreaterThan(0);
    expect(screen.getAllByText("user_1").length).toBeGreaterThan(0);
    expect(screen.getByText("user")).toBeInTheDocument();
    expect(screen.getByText("10.0.0.1")).toBeInTheDocument();
    expect(screen.getByText("Mozilla/5.0")).toBeInTheDocument();
    expect(screen.getByText("status:")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it("marks system events and empty changes", () => {
    render(
      <EventDrawer
        event={event({ user_id: null, changes: null })}
        open
        onOpenChange={vi.fn()}
      />,
    );
    expect(screen.getByText("System")).toBeInTheDocument();
    expect(screen.getByText("No changes recorded")).toBeInTheDocument();
  });
});
