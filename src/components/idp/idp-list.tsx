"use client";

import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useDeleteIdp, useIdps, useUpdateIdp } from "@/lib/queries/idp";
import { useAuth } from "@/lib/auth/auth-context";
import { PermissionDenied } from "@/components/auth/permission-denied";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageSkeleton } from "@/components/shared/loaders";
import { ConfirmDialog } from "@/components/organizations/confirm-dialog";
import { toAppError } from "@/lib/api/error";
import { t } from "@/lib/i18n";
import { IdpForm } from "./idp-form";
import { TestConnectionButton } from "./test-connection-button";
import type { IdpConfigDto } from "@/types/api";

/**
 * `/admin/identity-providers` — IdP list + editor (US-001-03-01).
 * LEES: skeleton / empty CTA / error+retry / table with protocol badge,
 * enabled switch, test-connection, edit and delete.
 */
export function IdpList() {
  const { can } = useAuth();
  const list = useIdps();
  const [editorIdp, setEditorIdp] = React.useState<IdpConfigDto | "new" | null>(null);
  const [deleteIdp, setDeleteIdp] = React.useState<IdpConfigDto | null>(null);

  if (!can("admin.read")) {
    return <PermissionDenied />;
  }

  return (
    <div className="space-y-4" data-testid="idp-page">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-primary">{t("idp.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("idp.description")}</p>
        </div>
        {can("admin.write") ? (
          <Button onClick={() => setEditorIdp("new")} data-testid="new-idp-button">
            {t("idp.newProvider")}
          </Button>
        ) : null}
      </div>

      {list.isPending ? <PageSkeleton lines={4} /> : null}
      {list.isError ? <ErrorState error={list.error} onRetry={() => void list.refetch()} /> : null}
      {list.isSuccess && list.data.length === 0 ? (
        <EmptyState title={t("idp.emptyTitle")} description={t("idp.emptyHint")} />
      ) : null}
      {list.isSuccess && list.data.length > 0 ? (
        <IdpTable idps={list.data} onEdit={setEditorIdp} onDelete={setDeleteIdp} />
      ) : null}

      <IdpForm
        open={editorIdp !== null}
        onOpenChange={(open) => {
          if (!open) setEditorIdp(null);
        }}
        idp={editorIdp === "new" ? null : editorIdp}
      />
      {deleteIdp ? <IdpDeleteDialog idp={deleteIdp} onClose={() => setDeleteIdp(null)} /> : null}
    </div>
  );
}

function IdpTable({
  idps,
  onEdit,
  onDelete,
}: {
  idps: IdpConfigDto[];
  onEdit: (idp: IdpConfigDto) => void;
  onDelete: (idp: IdpConfigDto) => void;
}) {
  const { can } = useAuth();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("idp.listTitle")}</CardTitle>
        <CardDescription>
          {idps.length} {idps.length === 1 ? t("idp.providerSingular") : t("idp.providerPlural")}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label={t("idp.listTitle")}>
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th scope="col" className="px-5 py-3 font-medium">
                  {t("idp.name")}
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  {t("idp.protocol")}
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  {t("idp.issuer")}
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  {t("idp.enabled")}
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  {t("idp.testConnection")}
                </th>
                <th scope="col" className="px-5 py-3 text-right font-medium">
                  <span className="sr-only">{t("idp.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {idps.map((idp) => (
                <tr key={idp.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium text-primary">{idp.name}</td>
                  <td className="px-5 py-3">
                    <ProtocolBadge protocol={idp.protocol} />
                  </td>
                  <td className="max-w-64 truncate px-5 py-3 text-muted">{idp.issuer}</td>
                  <td className="px-5 py-3">
                    {can("admin.write") ? (
                      <EnabledToggle idp={idp} />
                    ) : (
                      <span className="text-sm text-muted">
                        {idp.enabled ? t("idp.enabledState") : t("idp.disabledState")}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <TestConnectionButton idp={idp} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    {can("admin.write") ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(idp)}
                          aria-label={t("idp.editAction", { name: idp.name })}
                        >
                          <Pencil aria-hidden className="size-4" />
                          {t("roles.editActionShort")}
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => onDelete(idp)}
                          aria-label={t("idp.deleteAction", { name: idp.name })}
                        >
                          <Trash2 aria-hidden className="size-4" />
                          {t("roles.deleteActionShort")}
                        </Button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function ProtocolBadge({ protocol }: { protocol: IdpConfigDto["protocol"] }) {
  return (
    <Badge tone={protocol === "saml" ? "info" : "brand"} data-testid="idp-protocol-badge">
      {t(protocol === "saml" ? "idp.saml" : "idp.oidc")}
    </Badge>
  );
}

function EnabledToggle({ idp }: { idp: IdpConfigDto }) {
  const update = useUpdateIdp();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const handleToggle = async (checked: boolean) => {
    setServerError(null);
    try {
      await update.mutateAsync({ id: idp.id, payload: { enabled: checked } });
    } catch (error) {
      setServerError(toAppError(error).userMessage || t("common.somethingWentWrong"));
    }
  };

  return (
    <div className="space-y-1">
      <Switch
        checked={idp.enabled}
        onCheckedChange={(checked) => void handleToggle(checked)}
        disabled={update.isPending}
        aria-label={`${t("idp.enabled")}: ${idp.name}`}
        data-testid="idp-enabled-toggle"
      />
      {serverError ? (
        <p
          role="alert"
          data-testid="idp-toggle-error"
          className="max-w-48 text-xs text-danger-text"
        >
          {serverError}
        </p>
      ) : null}
    </div>
  );
}

function IdpDeleteDialog({ idp, onClose }: { idp: IdpConfigDto; onClose: () => void }) {
  const remove = useDeleteIdp();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const pending = remove.isPending;

  const handleConfirm = async () => {
    setServerError(null);
    try {
      await remove.mutateAsync(idp.id);
      onClose();
    } catch (error) {
      setServerError(toAppError(error).userMessage || t("common.somethingWentWrong"));
    }
  };

  return (
    <ConfirmDialog
      open
      onOpenChange={(next) => {
        if (pending) return;
        if (!next) onClose();
      }}
      title={t("idp.deleteTitle", { name: idp.name })}
      description={t("idp.deleteDescription")}
      confirmLabel={t("idp.deleteConfirmLabel")}
      busy={pending}
      onConfirm={() => void handleConfirm()}
    >
      {serverError ? (
        <p
          role="alert"
          data-testid="idp-delete-error"
          className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text"
        >
          {serverError}
        </p>
      ) : null}
    </ConfirmDialog>
  );
}
