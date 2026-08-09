import { ROLE_CAPABILITIES, type Capability } from "@/lib/rbac/permissions";

/**
 * Capability view-model (authorization-design.md §2).
 * Computed once per session, the AuthContext seeds from `/auth/me`
 * `permissions` strings (when present) or the role matrix. Backend remains
 * the enforcement authority; this is a UI mirror only.
 */

export function computeCapabilities(permissionStrings: readonly string[]): Set<Capability> {
  const set = new Set<Capability>();
  for (const value of permissionStrings) {
    set.add(value as Capability); // carry unknown/future constants intact
  }
  return set;
}

/** UI capability set for a known role (mirror of the role matrix §3). */
export function capabilitiesForRole(role: string): ReadonlySet<Capability> {
  return ROLE_CAPABILITIES[role.toLowerCase() as keyof typeof ROLE_CAPABILITIES] ??
    new Set<Capability>();
}

export function can(capabilities: ReadonlySet<Capability>, permission: Capability): boolean {
  return capabilities.has(permission);
}

/** True when the user can perform any of the given permissions. */
export function canAny(
  capabilities: ReadonlySet<Capability>,
  permissions: readonly Capability[],
): boolean {
  return permissions.some((p) => capabilities.has(p));
}

/** Derive a role hint (admin/reviewer/approver/editor/viewer) from capabilities. */
export function roleHint(
  capabilities: ReadonlySet<Capability>,
): "admin" | "reviewer" | "approver" | "editor" | "viewer" {
  if (can(capabilities, "admin.write")) return "admin";
  if (can(capabilities, "review.approve")) return "approver";
  if (can(capabilities, "review.write")) return "reviewer";
  if (can(capabilities, "document.write") || can(capabilities, "requirement.write")) {
    return "editor";
  }
  return "viewer";
}