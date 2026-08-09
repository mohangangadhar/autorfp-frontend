/**
 * RBAC capability name mirror (frontend-api-contract.md §8,
 * authorization-design.md §2).
 *
 * The backend is the enforcement authority. These constants only drive
 * UI gating (hide/disable); every route is still enforced server-side.
 */

export const PERMISSIONS = {
  DOCUMENT_READ: "document.read",
  DOCUMENT_WRITE: "document.write",
  REQUIREMENT_READ: "requirement.read",
  REQUIREMENT_WRITE: "requirement.write",
  CAPABILITY_READ: "capability.read",
  CAPABILITY_WRITE: "capability.write",
  EVIDENCE_READ: "evidence.read",
  EVIDENCE_WRITE: "evidence.write",
  COMPLIANCE_READ: "compliance.read",
  COMPLIANCE_WRITE: "compliance.write",
  RISK_READ: "risk.read",
  RISK_WRITE: "risk.write",
  RISK_OVERRIDE: "risk.override",
  PROPOSAL_READ: "proposal.read",
  PROPOSAL_WRITE: "proposal.write",
  QUALIFICATION_READ: "qualification.read",
  QUALIFICATION_WRITE: "qualification.write",
  REVIEW_READ: "review.read",
  REVIEW_WRITE: "review.write",
  REVIEW_APPROVE: "review.approve",
  NOTIFICATION_READ: "notification.read",
  AUDIT_READ: "admin.audit",
  ADMIN_READ: "admin.read",
  ADMIN_WRITE: "admin.write",
  USER_ADMIN: "admin.user",
  ROLE_ADMIN: "admin.role",
  AI_EVALUATE: "ai.evaluate",
} as const;

export type Capability = (typeof PERMISSION_CAP)[number];

const PERMISSION_CAP = [
  "document.read",
  "document.write",
  "requirement.read",
  "requirement.write",
  "capability.read",
  "capability.write",
  "evidence.read",
  "evidence.write",
  "compliance.read",
  "compliance.write",
  "risk.read",
  "risk.write",
  "risk.override",
  "proposal.read",
  "proposal.write",
  "qualification.read",
  "qualification.write",
  "review.read",
  "review.write",
  "review.approve",
  "notification.read",
  "admin.audit",
  "admin.read",
  "admin.write",
  "admin.user",
  "admin.role",
  "admin.evaluate",
] as const;

/** Predefined role → capability sets (mirrors backend role matrix §3). */
export const ROLE_CAPABILITIES: Record<string, ReadonlySet<Capability>> = {
  viewer: readOnlyCapabilities(),
  editor: readOnlyCapabilities().add("document.write" as Capability).add("requirement.write" as Capability).add("proposal.write" as Capability).add("evidence.write" as Capability),
  reviewer: readOnlyCapabilities().add("review.write" as Capability),
  approver: readOnlyCapabilities().add("review.write" as Capability).add("review.approve" as Capability),
  "bid_manager": readOnlyCapabilities().add("document.write").add("requirement.write").add("capability.write").add("risk.write").add("risk.override").add("proposal.write").add("evidence.write"),
  "org_admin": allCapabilities(),
} satisfies Record<string, ReadonlySet<Capability>>;

function readOnlyCapabilities(): Set<Capability> {
  return new Set([
    "document.read",
    "requirement.read",
    "capability.read",
    "evidence.read",
    "compliance.read",
    "risk.read",
    "proposal.read",
    "qualification.read",
    "review.read",
    "notification.read",
  ]);
}

function allCapabilities(): Set<Capability> {
  return new Set(PERMISSION_CAP);
}

export function isCapability(value: string): value is Capability {
  return (PERMISSION_CAP as readonly string[]).includes(value);
}