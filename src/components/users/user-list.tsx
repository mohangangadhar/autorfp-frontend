"use client";

import { useUsers } from "@/lib/queries/users";
import { useAuth } from "@/lib/auth/auth-context";
import { PermissionDenied } from "@/components/auth/permission-denied";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageSkeleton } from "@/components/shared/loaders";
import { t } from "@/lib/i18n";
import { ROLE_LABELS } from "./roles";
import { DeactivateDialog } from "./deactivate-dialog";
import type { UserProfile } from "@/types/api";

const USER_STATUS_TONES: Record<"invited" | "active", NonNullable<BadgeProps["tone"]>> = {
  invited: "warning",
  active: "success",
};

function userStatus(user: UserProfile): "invited" | "active" {
  return user.is_active ? "active" : "invited";
}

/**
 * `/admin/users` — pending/team member list (US-001-02-01). LEES: skeleton /
 * empty / error+retry / table with status badge + role capsule.
 */
export function UserList() {
  const { can } = useAuth();
  const list = useUsers({ page: 1, perPage: 50 });

  if (!can("admin.read")) {
    return <PermissionDenied />;
  }

  if (list.isPending) return <PageSkeleton lines={5} />;
  if (list.isError) return <ErrorState error={list.error} onRetry={() => void list.refetch()} />;
  if (list.data.items.length === 0) {
    return <EmptyState title={t("users.emptyTitle")} description={t("users.emptyHint")} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("users.listTitle")}</CardTitle>
        <CardDescription>
          {list.data.items.length} {list.data.items.length === 1 ? "member" : "members"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label={t("users.listTitle")}>
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th scope="col" className="px-5 py-3 font-medium">
                  {t("users.name")}
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  {t("users.email")}
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  {t("users.role")}
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  {t("users.status")}
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  <span className="sr-only">{t("users.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {list.data.items.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium text-primary">{user.name}</td>
                  <td className="px-5 py-3 text-muted">{user.email}</td>
                  <td className="px-5 py-3">
                    <RoleCapsule user={user} />
                  </td>
                  <td className="px-5 py-3">
                    <UserStatusBadge user={user} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <DeactivateDialog user={user} />
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

/** Role capsule — labeled from the catalog, unknown roles fall back to raw. */
function RoleCapsule({ user }: { user: UserProfile }) {
  const label = ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? (user.role as `users.${string}`);
  return (
    <Badge tone="brand" data-testid="role-capsule">
      {t(label)}
    </Badge>
  );
}

function UserStatusBadge({ user }: { user: UserProfile }) {
  const status = userStatus(user);
  const label = status === "active" ? t("users.statusActive") : t("users.statusInvited");
  return (
    <Badge tone={USER_STATUS_TONES[status]} data-testid="user-status">
      {label}
    </Badge>
  );
}
