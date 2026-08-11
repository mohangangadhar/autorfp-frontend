/**
 * DTO types mirroring frontend-api-contract.md §7 (response models are
 * plain — no envelope). Fields are snake_case as received because the
 * API layer maps DTO → view model.
 */

/** `{id, organization_id, email, name, role, is_active, last_login_at, created_at, updated_at}` */
export interface UserProfile {
  id: string;
  organization_id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

/** `{access_token, refresh_token, token_type:"bearer", expires_in}` */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

/** Payload returned by the BFF after the cookie-rotation bootstrap. */
export interface SessionPayload {
  access_token: string;
  expires_in: number;
  user: UserProfile;
}

/** Notification WS message (contract §5). */
export interface NotificationEvent {
  type: string;
  title: string;
  body: string;
  source: string;
  source_id: string;
  priority: string;
  created_at: string;
}

/** Upload progress WS message (contract §5). */
export interface DocumentProgressEvent {
  type: "document_progress" | "batch_complete";
  file_id?: string;
  file_name?: string;
  status?: string;
  progress_pct?: number;
  error_message?: string;
}

/** Long-running job status (contract §6). */
export interface JobStatus {
  id: string;
  status: string; // pending | processing | completed | failed | ...
  progress_pct?: number;
  error_message?: string | null;
}

/** Organization lifecycle state (TDD-020 §state machine). */
export type OrganizationStatus = "provisioning" | "active" | "suspended" | "archived";

/** Tenant `settings` JSONB (backend `OrganizationCreate.settings`: `dict[str, Any]`). */
export type OrganizationSettings = Record<string, unknown>;

/** `OrganizationDto` — org payload from `/organizations` (backend `OrganizationResponse`). */
export interface OrganizationDto {
  id: string;
  name: string;
  slug: string;
  status: OrganizationStatus;
  settings: OrganizationSettings;
  created_at: string;
  updated_at: string | null;
}

/** `POST /organizations` request body (backend `OrganizationCreate`: name/slug/settings). */
export interface OrganizationCreateRequest {
  name: string;
  slug: string;
  settings?: OrganizationSettings;
}

/** Roles accepted by `POST /users/invite` (backend `InviteRequest.role` regex). */
export type InviteRole = "viewer" | "editor" | "org_admin";

/** `POST /users/invite` request body (backend `InviteRequest`). */
export interface InviteUserRequest {
  email: string;
  name: string;
  role: InviteRole;
}

/** `RoleResponse` — role from `/roles` (backend `app/schemas/role.py`). */
export interface RoleDto {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  is_predefined: boolean;
  permission_bitmap: number;
  created_at: string;
  updated_at: string | null;
}

/** `POST /roles` request body (backend `RoleCreateRequest`). */
export interface RoleCreateRequest {
  name: string;
  description?: string | null;
  permission_bitmap: number;
}

/** `PUT /roles/{id}` request body (backend `RoleUpdateRequest`). */
export interface RoleUpdateRequest {
  name?: string;
  description?: string | null;
  permission_bitmap?: number;
}

/**
 * Identity provider types (US-001-03-01).
 *
 * Backend contract is the issue's documented `/api/v1/idp` CRUD +
 * `POST /api/v1/idp/test-connection`. The endpoints do not exist in the
 * backend yet (auth.py), so these are the agreed frontend-side shapes.
 */

/** Supported federation protocols. */
export type IdpProtocol = "saml" | "oidc";

/** Provider attribute → local user field mapping (e.g. `email` → `email`). */
export type AttributeMapping = Record<string, string>;

/** `IdpConfig` — an identity provider row from `/idp`. */
export interface IdpConfigDto {
  id: string;
  organization_id: string;
  protocol: IdpProtocol;
  name: string;
  issuer: string;
  /** SAML metadata URL or OIDC discovery/authority URL (optional). */
  metadata_url: string | null;
  /** SAML signing certificate (PEM, pasted). */
  certificate: string | null;
  /** OIDC client id. */
  client_id: string | null;
  /** OIDC client secret (masked in list/detail responses). */
  client_secret: string | null;
  attribute_mapping: AttributeMapping;
  enabled: boolean;
  created_at: string;
  updated_at: string | null;
}

/** `POST /idp` request body (protocol-conditional fields). */
export interface IdpCreateRequest {
  protocol: IdpProtocol;
  name: string;
  issuer: string;
  metadata_url?: string | null;
  certificate?: string | null;
  client_id?: string | null;
  client_secret?: string | null;
  attribute_mapping: AttributeMapping;
  enabled: boolean;
}

/** `PUT /idp/{id}` request body — all optional. */
export interface IdpUpdateRequest {
  name?: string;
  issuer?: string;
  metadata_url?: string | null;
  certificate?: string | null;
  client_id?: string | null;
  client_secret?: string | null;
  attribute_mapping?: AttributeMapping;
  enabled?: boolean;
}

/** `POST /idp/test-connection` response — detailed success/failure. */
export interface TestConnectionResponse {
  success: boolean;
  message: string;
  status: string;
  checked_at: string;
  details?: Record<string, string>;
}

/** `AuditLog` — an immutable audit event row from `/audit`. */
export interface AuditLogDto {
  id: string;
  organization_id: string;
  /** Actor user id; `null` for system-authored events. */
  user_id: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  /** Optional structured change payload (`{field: value}`). */
  changes: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

/** `AuditLog` — one `{action, count}` / `{entity_type, count}` bucket from stats. */
export interface AuditBreakdownItem {
  [key: string]: unknown;
  count: number;
}

/** `AuditStatsResponse` — `/audit/stats` summary. */
export interface AuditStatsDto {
  total_entries: number;
  total_organizations: number;
  actions_breakdown: AuditBreakdownItem[];
  entity_type_breakdown: AuditBreakdownItem[];
}

/** Server-side audit query filters (mirrors `/audit` query params). */
export interface AuditLogFilters {
  action?: string;
  user_id?: string;
  entity_type?: string;
  entity_id?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: "created_at";
  sort_order?: "asc" | "desc";
  page?: number;
  perPage?: number;
}
