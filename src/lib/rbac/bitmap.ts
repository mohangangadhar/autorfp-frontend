/**
 * Permission bitmap mirror (backend `app/services/authorization_service.py`).
 *
 * The backend stores role permissions as a single integer bitmap. This module
 * mirrors the bit positions and canonical names so the frontend can render the
 * grouped PermissionMatrix and compute `permission_bitmap` values for create/
 * update without duplicating business logic. The backend remains the
 * enforcement authority.
 */

/** Permission bit constants (mirror of `authorization_service.py`). */
export const PERMISSION_BITS = {
  DOCUMENT_READ: 1 << 0,
  DOCUMENT_WRITE: 1 << 1,
  REQUIREMENT_READ: 1 << 2,
  REQUIREMENT_WRITE: 1 << 3,
  ANALYSIS_READ: 1 << 4,
  ANALYSIS_RUN: 1 << 5,
  USER_READ: 1 << 6,
  USER_WRITE: 1 << 7,
  ROLE_READ: 1 << 8,
  ROLE_WRITE: 1 << 9,
  ORG_READ: 1 << 10,
  ORG_WRITE: 1 << 11,
  ORG_DELETE: 1 << 12,
  BILLING_READ: 1 << 13,
  BILLING_WRITE: 1 << 14,
  AUDIT_READ: 1 << 15,
  PROJECT_READ: 1 << 16,
  PROJECT_WRITE: 1 << 17,
  CAPABILITY_READ: 1 << 18,
  CAPABILITY_WRITE: 1 << 19,
  QUALIFICATION_READ: 1 << 20,
  QUALIFICATION_WRITE: 1 << 21,
} as const;

export type PermissionBitName = keyof typeof PERMISSION_BITS;

/** Canonical permission names (mirror of `PERMISSION_NAMES` in the backend). */
export const PERMISSION_NAMES: Record<PermissionBitName, string> = {
  DOCUMENT_READ: "document:read",
  DOCUMENT_WRITE: "document:write",
  REQUIREMENT_READ: "requirement:read",
  REQUIREMENT_WRITE: "requirement:write",
  ANALYSIS_READ: "analysis:read",
  ANALYSIS_RUN: "analysis:run",
  USER_READ: "user:read",
  USER_WRITE: "user:write",
  ROLE_READ: "role:read",
  ROLE_WRITE: "role:write",
  ORG_READ: "org:read",
  ORG_WRITE: "org:write",
  ORG_DELETE: "org:delete",
  BILLING_READ: "billing:read",
  BILLING_WRITE: "billing:write",
  AUDIT_READ: "audit:read",
  PROJECT_READ: "project:read",
  PROJECT_WRITE: "project:write",
  CAPABILITY_READ: "capability:read",
  CAPABILITY_WRITE: "capability:write",
  QUALIFICATION_READ: "qualification:read",
  QUALIFICATION_WRITE: "qualification:write",
};

/** i18n label key for each permission (used by the PermissionMatrix). */
export const PERMISSION_LABEL_KEYS: Record<PermissionBitName, `roles.permission.${string}`> = {
  DOCUMENT_READ: "roles.permission.document.read",
  DOCUMENT_WRITE: "roles.permission.document.write",
  REQUIREMENT_READ: "roles.permission.requirement.read",
  REQUIREMENT_WRITE: "roles.permission.requirement.write",
  ANALYSIS_READ: "roles.permission.analysis.read",
  ANALYSIS_RUN: "roles.permission.analysis.run",
  USER_READ: "roles.permission.user.read",
  USER_WRITE: "roles.permission.user.write",
  ROLE_READ: "roles.permission.role.read",
  ROLE_WRITE: "roles.permission.role.write",
  ORG_READ: "roles.permission.org.read",
  ORG_WRITE: "roles.permission.org.write",
  ORG_DELETE: "roles.permission.org.delete",
  BILLING_READ: "roles.permission.billing.read",
  BILLING_WRITE: "roles.permission.billing.write",
  AUDIT_READ: "roles.permission.audit.read",
  PROJECT_READ: "roles.permission.project.read",
  PROJECT_WRITE: "roles.permission.project.write",
  CAPABILITY_READ: "roles.permission.capability.read",
  CAPABILITY_WRITE: "roles.permission.capability.write",
  QUALIFICATION_READ: "roles.permission.qualification.read",
  QUALIFICATION_WRITE: "roles.permission.qualification.write",
};

export interface PermissionGroup {
  /** i18n label key for the module group. */
  labelKey: `roles.group.${string}`;
  permissions: readonly PermissionBitName[];
}

/** Grouped permission tree (PermissionMatrix renders one group per module). */
export const PERMISSION_GROUPS: readonly PermissionGroup[] = [
  { labelKey: "roles.group.documents", permissions: ["DOCUMENT_READ", "DOCUMENT_WRITE"] },
  { labelKey: "roles.group.requirements", permissions: ["REQUIREMENT_READ", "REQUIREMENT_WRITE"] },
  { labelKey: "roles.group.analysis", permissions: ["ANALYSIS_READ", "ANALYSIS_RUN"] },
  { labelKey: "roles.group.users", permissions: ["USER_READ", "USER_WRITE"] },
  { labelKey: "roles.group.roles", permissions: ["ROLE_READ", "ROLE_WRITE"] },
  { labelKey: "roles.group.organization", permissions: ["ORG_READ", "ORG_WRITE", "ORG_DELETE"] },
  { labelKey: "roles.group.billing", permissions: ["BILLING_READ", "BILLING_WRITE"] },
  { labelKey: "roles.group.audit", permissions: ["AUDIT_READ"] },
  { labelKey: "roles.group.projects", permissions: ["PROJECT_READ", "PROJECT_WRITE"] },
  { labelKey: "roles.group.capabilities", permissions: ["CAPABILITY_READ", "CAPABILITY_WRITE"] },
  { labelKey: "roles.group.qualification", permissions: ["QUALIFICATION_READ", "QUALIFICATION_WRITE"] },
];

/** True when the given bit is set in a bitmap. */
export function hasPermission(bitmap: number, bit: PermissionBitName): boolean {
  return (bitmap & PERMISSION_BITS[bit]) !== 0;
}

/** Return the set of permission names present in a bitmap. */
export function bitmapToNames(bitmap: number): ReadonlySet<PermissionBitName> {
  const names = new Set<PermissionBitName>();
  for (const name of Object.keys(PERMISSION_BITS) as PermissionBitName[]) {
    if (hasPermission(bitmap, name)) names.add(name);
  }
  return names;
}

/** OR a set of permission names into a bitmap (empty set → 0). */
export function namesToBitmap(names: ReadonlySet<PermissionBitName> | readonly PermissionBitName[]): number {
  let bitmap = 0;
  for (const name of names) bitmap |= PERMISSION_BITS[name];
  return bitmap;
}
