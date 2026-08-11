import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AuditLogDto } from "@/types/api";
import { AuditTable } from "./audit-table";

function event(partial: Partial<AuditLogDto>): AuditLogDto {
  return {
    id: "event_1",
    organization_id: "org_1",
    user_id: "user_1",
    entity_type: "user",
    entity_id: "user_1",
    action: "user.login",
    changes: null,
    ip_address: "10.0.0.1",
    user_agent: null,
    created_at: "2026-08-01T12:00:00Z",
    ...partial,
  };
}

function setup(overrides: Partial<Parameters<typeof AuditTable>[0]> = {}) {
  const props = {
    events: [event({})],
    total: 1,
    sortOrder: "desc" as const,
    onSortChange: vi.fn(),
    page: 1,
    totalPages: 1,
    onPageChange: vi.fn(),
    onSelect: vi.fn(),
    ...overrides,
  };
  const utils = render(<AuditTable {...props} />);
  return { props, ...utils };
}

describe("AuditTable", () => {
  it("renders audit event rows with actor, action and resource", () => {
    setup({
      events: [
        event({ action: "user.login" }),
        event({ id: "event_2", user_id: null, action: "system.cleanup", entity_type: "job" }),
      ],
    });
    expect(screen.getByRole("table", { name: "Audit events" })).toBeInTheDocument();
    expect(screen.getAllByText("user.login").length).toBeGreaterThan(0);
    expect(screen.getByText("system.cleanup")).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
    expect(screen.getByText(/job/)).toBeInTheDocument();
  });

  it("toggles created_at sort direction", async () => {
    const user = userEvent.setup();
    const { props } = setup({ sortOrder: "desc" });
    await user.click(screen.getByRole("button", { name: "Sort by time, oldest first" }));
    expect(props.onSortChange).toHaveBeenCalledWith("asc");
  });

  it("opens the event drawer on row click", async () => {
    const user = userEvent.setup();
    const { props } = setup();
    await user.click(screen.getByTestId("audit-row"));
    expect(props.onSelect).toHaveBeenCalledWith(props.events[0]);
  });

  it("opens the event drawer via the row details button", async () => {
    const user = userEvent.setup();
    const { props } = setup();
    await user.click(screen.getByTestId("audit-row-details"));
    expect(props.onSelect).toHaveBeenCalledWith(props.events[0]);
  });

  it("disables pagination at page boundaries", () => {
    setup({ page: 1, totalPages: 1 });
    expect(screen.getByTestId("pagination-prev")).toBeDisabled();
    expect(screen.getByTestId("pagination-next")).toBeDisabled();
  });

  it("requests the next page", async () => {
    const user = userEvent.setup();
    const { props } = setup({ page: 1, totalPages: 3 });
    await user.click(screen.getByTestId("pagination-next"));
    expect(props.onPageChange).toHaveBeenCalledWith(2);
  });
});
