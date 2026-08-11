"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { PermissionDenied } from "@/components/auth/permission-denied";
import { t } from "@/lib/i18n";
import { InviteForm } from "./invite-form";
import { UserList } from "./user-list";

/**
 * `/admin/users` — invite team members by email with role assignment
 * (US-001-02-01). The invite form is `admin.write`-gated; the list is
 * visible to anyone with `admin.read`. Backend enforces `USER_WRITE`/`USER_READ`
 * + org_admin role.
 */
export function UsersPage() {
  const { can } = useAuth();

  if (!can("admin.read")) {
    return <PermissionDenied />;
  }

  return (
    <div className="space-y-6" data-testid="users-page">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-primary">{t("users.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("users.description")}</p>
      </header>
      {can("admin.write") ? <InviteForm /> : null}
      <UserList />
    </div>
  );
}
