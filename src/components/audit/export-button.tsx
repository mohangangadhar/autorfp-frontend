"use client";

import * as React from "react";
import { Download } from "lucide-react";
import type { AuditLogFilters } from "@/types/api";
import { Button } from "@/components/ui/button";
import { toAppError } from "@/lib/api/error";
import { exportAuditCsv } from "@/lib/queries/audit";
import { t } from "@/lib/i18n";

/**
 * `/admin/audit` — CSV export (backend `/audit/export`, text/csv).
 *
 * Fetches through the authenticated apiClient (plain `<a href>` cannot carry
 * the Authorization header) then triggers a browser download of the blob.
 */
export function ExportButton({
  filters,
  disabled,
}: {
  filters: AuditLogFilters;
  disabled?: boolean;
}) {
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<{ ok: boolean; text: string } | null>(null);

  const handleExport = async () => {
    setPending(true);
    setMessage(null);
    try {
      const { text, filename } = await exportAuditCsv(filters);
      downloadText(text, filename);
      setMessage({ ok: true, text: t("audit.exportSuccess") });
    } catch (error) {
      const appError = toAppError(error);
      setMessage({ ok: false, text: appError.userMessage || t("audit.exportFailed") });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        type="button"
        variant="outline"
        isLoading={pending}
        disabled={disabled}
        onClick={() => void handleExport()}
        data-testid="audit-export-button"
      >
        <Download aria-hidden />
        {pending ? t("audit.exporting") : t("audit.export")}
      </Button>
      {message ? (
        <p
          role={message.ok ? "status" : "alert"}
          data-testid={message.ok ? "audit-export-success" : "audit-export-error"}
          className={`text-xs ${message.ok ? "text-success-text" : "text-danger-text"}`}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
