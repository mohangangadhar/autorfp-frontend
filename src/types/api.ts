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