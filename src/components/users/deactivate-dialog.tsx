"use client";

import * as React from "react";
import { UserX, UserCheck } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useToggleUserStatus } from "@/lib/queries/users";
import { toAppError } from "@/lib/api/error";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { ConfirmDialog } from "@/components/organizations/confirm-dialog";
import type { UserProfile } from "@/types/api";

/**
 * DeactivateDialog — per-row deactivate/reactivate (US-001-02-02).
 * Deactivation is a soft state: access is revoked server-side while the
 * user's authored content stays visible/read-only. Hidden for the current
 * session user (backend rejects self-deactivation), for non-`admin.write`
 * users, and when the row has no applicable action. A failed mutation
 * (e.g. backend 409 USR-004 last-admin guard) keeps the dialog open with
 * an inline error (LEES).
 */
export function DeactivateDialog({ user }: { user: UserProfile }) {
  const { can, user: currentUser } = useAuth();
  const toggle = useToggleUserStatus();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const isSelf = currentUser?.id === user.id;
  const isDeactivate = user.is_active;

  if (!can("admin.write") || isSelf) return null;

  const pending = toggle.isPending;

  const handleConfirm = async () => {
    setServerError(null);
    try {
      await toggle.mutateAsync({ id: user.id, isActive: user.is_active });
      setConfirmOpen(false);
    } catch (error) {
      const appError = toAppError(error);
      const message =
        appError.code === "CONFLICT" && appError.developerMessage === "USR-004"
          ? t("users.lastAdminError")
          : appError.userMessage || t("common.somethingWentWrong");
      setServerError(message);
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
        {isDeactivate ? (
          <UserX aria-hidden className="size-4" />
        ) : (
          <UserCheck aria-hidden className="size-4" />
        )}
        {isDeactivate ? t("users.deactivateAction") : t("users.reactivateAction")}
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(next) => {
          if (pending) return;
          setConfirmOpen(next);
          if (!next) setServerError(null);
        }}
        title={
          isDeactivate
            ? t("users.deactivateConfirmTitle", { name: user.name })
            : t("users.reactivateConfirmTitle", { name: user.name })
        }
        description={
          isDeactivate
            ? t("users.deactivateConfirmDescription")
            : t("users.reactivateConfirmDescription")
        }
        confirmLabel={
          isDeactivate ? t("users.deactivateConfirmLabel") : t("users.reactivateConfirmLabel")
        }
        busy={pending}
        onConfirm={() => void handleConfirm()}
      >
        {serverError ? (
          <p
            role="alert"
            data-testid="user-toggle-error"
            className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text"
          >
            {serverError}
          </p>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
