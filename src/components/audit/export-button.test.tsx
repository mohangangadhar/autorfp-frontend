import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppError } from "@/lib/api/error";

const { exportAuditCsv } = vi.hoisted(() => ({ exportAuditCsv: vi.fn() }));

vi.mock("@/lib/queries/audit", () => ({ exportAuditCsv }));

import { ExportButton } from "./export-button";

describe("ExportButton", () => {
  beforeEach(() => {
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:mock"),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("exports CSV and reports success", async () => {
    const user = userEvent.setup();
    exportAuditCsv.mockResolvedValue({ text: "id,action\n", filename: "audit_log.csv" });

    render(<ExportButton filters={{}} />);
    await user.click(screen.getByTestId("audit-export-button"));

    expect(exportAuditCsv).toHaveBeenCalledWith({});
    expect(await screen.findByTestId("audit-export-success")).toBeInTheDocument();
    expect(screen.getByText("Audit log exported.")).toBeInTheDocument();
  });

  it("reports a user-safe error when export fails", async () => {
    const user = userEvent.setup();
    exportAuditCsv.mockRejectedValue(
      new AppError({ code: "INTERNAL", httpStatus: 500, userMessage: "Export unavailable" }),
    );

    render(<ExportButton filters={{ action: "user.login" }} />);
    await user.click(screen.getByTestId("audit-export-button"));

    expect(await screen.findByTestId("audit-export-error")).toBeInTheDocument();
    expect(screen.getByText("Export unavailable")).toBeInTheDocument();
  });
});
