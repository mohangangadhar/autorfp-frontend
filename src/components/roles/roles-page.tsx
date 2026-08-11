"use client";

import { RoleList } from "./role-list";

/**
 * `/admin/roles` — manage roles with granular permissions (US-001-02-03).
 * Composes the LEES role list + editor; gating handled inside `RoleList`.
 */
export function RolesPage() {
  return <RoleList />;
}
