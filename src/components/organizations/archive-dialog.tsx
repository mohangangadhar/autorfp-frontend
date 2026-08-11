"use client";

import * as React from "react";
import { Archive } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useArchiveOrg } from "@/lib/queries/organizations";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { ConfirmDialog } from "./confirm-dialog";
import { toAppError } from "./server-errors";
import type { OrganizationDto } from "@/types/api";

/**
 * ArchiveDialog — per-row archive (US-001-01-03). Hidden for terminal
 * `archived` orgs and for users without `admin.write` (backend enforces
 * `ORG_DELETE`). Backend `DELETE /organizations/{id}` takes no retention
 * parameter, so the dialog communicates the compliance guarantee ("data is
 * retained, never deleted") instead of sending a value the API would ignore.
 * LEES: busy/pending, inline error on failure, success via list invalidation.
 */
export function ArchiveDialog({ org }: { org: OrganizationDto }) {
  const { can } = useAuth();
  const archive = useArchiveOrg();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  if (!can("admin.write") || org.status === "archived") return null;

  const pending = archive.isPending;

  const handleConfirm = async () => {
    setServerError(null);
    try {
      await archive.mutateAsync(org.id);
      setConfirmOpen(false);
    } catch (error) {
      setServerError(toAppError(error).userMessage || t("common.somethingWentWrong"));
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-busy={pending || undefined}
        onClick={() => setConfirmOpen(true)}
      >
        <Archive aria-hidden className="size-4" />
        {t("org.archiveAction")}
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(next) => {
          if (pending) return;
          setConfirmOpen(next);
          if (!next) setServerError(null);
        }}
        title={t("org.archiveConfirmTitle", { name: org.name })}
        description={t("org.archiveConfirmDescription")}
        confirmLabel={t("org.archiveConfirmLabel")}
        busy={pending}
        onConfirm={() => void handleConfirm()}
      >
        <p
          role="note"
          data-testid="archive-retention-note"
          className="rounded-md bg-info-bg px-3 py-2 text-sm text-info-text"
        >
          {t("org.archiveRetentionNote")}
        </p>
        {serverError ? (
          <p
            role="alert"
            data-testid="archive-error"
            className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text"
          >
            {serverError}
          </p>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
