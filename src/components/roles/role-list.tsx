"use client";

import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useRoles, useDeleteRole } from "@/lib/queries/roles";
import { useAuth } from "@/lib/auth/auth-context";
import { PermissionDenied } from "@/components/auth/permission-denied";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageSkeleton } from "@/components/shared/loaders";
import { ConfirmDialog } from "@/components/organizations/confirm-dialog";
import { toAppError } from "@/lib/api/error";
import { t } from "@/lib/i18n";
import { bitmapToNames } from "@/lib/rbac/bitmap";
import { RoleEditor } from "./role-editor";
import type { RoleDto } from "@/types/api";

/**
 * `/admin/roles` — role list + role editor (US-001-02-03).
 * LEES: skeleton / empty CTA / error+retry / table with permission count,
 * predefined badge, and edit/delete for custom roles. Predefined roles are
 * immutable (backend rejects edits with 400).
 */
export function RoleList() {
  const { can } = useAuth();
  const list = useRoles({ page: 1, perPage: 50 });
  const [editorRole, setEditorRole] = React.useState<RoleDto | "new" | null>(null);
  const [deleteRole, setDeleteRole] = React.useState<RoleDto | null>(null);

  if (!can("admin.read")) {
    return <PermissionDenied />;
  }

  return (
    <div className="space-y-4" data-testid="roles-page">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-primary">{t("roles.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("roles.description")}</p>
        </div>
        {can("admin.write") ? (
          <Button onClick={() => setEditorRole("new")} data-testid="new-role-button">
            {t("roles.newRole")}
          </Button>
        ) : null}
      </div>

      {list.isPending ? <PageSkeleton lines={5} /> : null}
      {list.isError ? <ErrorState error={list.error} onRetry={() => void list.refetch()} /> : null}
      {list.isSuccess && list.data.items.length === 0 ? (
        <EmptyState title={t("roles.emptyTitle")} description={t("roles.emptyHint")} />
      ) : null}
      {list.isSuccess && list.data.items.length > 0 ? (
        <RolesTable roles={list.data.items} onEdit={setEditorRole} onDelete={setDeleteRole} />
      ) : null}

      <RoleEditor
        open={editorRole !== null}
        onOpenChange={(open) => {
          if (!open) setEditorRole(null);
        }}
        role={editorRole === "new" ? null : editorRole}
      />
      {deleteRole ? (
        <RoleDeleteDialog role={deleteRole} onClose={() => setDeleteRole(null)} />
      ) : null}
    </div>
  );
}

function RolesTable({
  roles,
  onEdit,
  onDelete,
}: {
  roles: RoleDto[];
  onEdit: (role: RoleDto) => void;
  onDelete: (role: RoleDto) => void;
}) {
  const { can } = useAuth();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("roles.listTitle")}</CardTitle>
        <CardDescription>
          {roles.length} {roles.length === 1 ? t("roles.role") : t("roles.roles")}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label={t("roles.listTitle")}>
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th scope="col" className="px-5 py-3 font-medium">
                  {t("roles.name")}
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  {t("roles.description")}
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  {t("roles.permissions")}
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  {t("roles.type")}
                </th>
                <th scope="col" className="px-5 py-3 text-right font-medium">
                  <span className="sr-only">{t("roles.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium text-primary">{role.name}</td>
                  <td className="px-5 py-3 text-muted">{role.description ?? "—"}</td>
                  <td className="px-5 py-3">{bitmapToNames(role.permission_bitmap).size}</td>
                  <td className="px-5 py-3">
                    <RoleTypeBadge predefined={role.is_predefined} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    {can("admin.write") && !role.is_predefined ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(role)}
                          aria-label={t("roles.editAction", { name: role.name })}
                        >
                          <Pencil aria-hidden className="size-4" />
                          {t("roles.editActionShort")}
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => onDelete(role)}
                          aria-label={t("roles.deleteAction", { name: role.name })}
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

function RoleTypeBadge({ predefined }: { predefined: boolean }) {
  return predefined ? (
    <Badge tone="neutral" data-testid="role-predefined">
      {t("roles.predefined")}
    </Badge>
  ) : (
    <Badge tone="brand" data-testid="role-custom">
      {t("roles.custom")}
    </Badge>
  );
}

function RoleDeleteDialog({ role, onClose }: { role: RoleDto; onClose: () => void }) {
  const remove = useDeleteRole();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const pending = remove.isPending;

  const handleConfirm = async () => {
    setServerError(null);
    try {
      await remove.mutateAsync(role.id);
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
      title={t("roles.deleteTitle", { name: role.name })}
      description={t("roles.deleteDescription")}
      confirmLabel={t("roles.deleteConfirmLabel")}
      busy={pending}
      onConfirm={() => void handleConfirm()}
    >
      {serverError ? (
        <p
          role="alert"
          data-testid="role-delete-error"
          className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text"
        >
          {serverError}
        </p>
      ) : null}
    </ConfirmDialog>
  );
}
