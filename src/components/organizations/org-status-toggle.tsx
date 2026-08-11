"use client";

import * as React from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useToggleOrgStatus } from "@/lib/queries/organizations";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { ConfirmDialog } from "./confirm-dialog";
import { toAppError } from "./server-errors";
import type { OrganizationDto } from "@/types/api";

/**
 * OrgStatusToggle — per-row suspend/reactivate (US-001-01-02).
 * Renders only for `admin.write` on active/suspended orgs (TDD-020 state
 * machine allows active ↔ suspended; provisioning/archived have no action).
 * Confirm dialog surfaces the consequences; a failed mutation keeps the
 * dialog open with an inline error (LEES).
 */
export function OrgStatusToggle({ org }: { org: OrganizationDto }) {
  const { can } = useAuth();
  const toggle = useToggleOrgStatus();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const action =
    org.status === "active" ? "suspend" : org.status === "suspended" ? "reactivate" : null;

  if (!can("admin.write") || action === null) return null;

  const isSuspend = action === "suspend";
  const pending = toggle.isPending;

  const handleConfirm = async () => {
    setServerError(null);
    try {
      await toggle.mutateAsync({
        id: org.id,
        status: isSuspend ? "suspended" : "active",
      });
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
        {isSuspend ? t("org.suspendAction") : t("org.reactivateAction")}
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(next) => {
          if (pending) return;
          setConfirmOpen(next);
          if (!next) setServerError(null);
        }}
        title={
          isSuspend
            ? t("org.suspendConfirmTitle", { name: org.name })
            : t("org.reactivateConfirmTitle", { name: org.name })
        }
        description={
          isSuspend
            ? t("org.suspendConfirmDescription")
            : t("org.reactivateConfirmDescription")
        }
        confirmLabel={isSuspend ? t("org.suspendConfirmLabel") : t("org.reactivateConfirmLabel")}
        busy={pending}
        onConfirm={() => void handleConfirm()}
      >
        {serverError ? (
          <p
            role="alert"
            data-testid="toggle-error"
            className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text"
          >
            {serverError}
          </p>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
