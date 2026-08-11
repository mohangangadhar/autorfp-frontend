import type { MessageKey } from "@/lib/i18n/messages";
import type { InviteRole } from "@/types/api";

/** Roles accepted by `POST /users/invite` (backend `InviteRequest.role` regex). */
export const INVITE_ROLES: readonly InviteRole[] = ["viewer", "editor", "org_admin"];

/** Display labels for invite roles (i18n catalog keys). */
export const ROLE_LABELS: Record<InviteRole, MessageKey> = {
  viewer: "users.role_viewer",
  editor: "users.role_editor",
  org_admin: "users.role_org_admin",
};
