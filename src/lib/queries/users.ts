"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import {
  normalizePaginated,
  pageParamsToQuery,
  type PageParams,
  type Paginated,
} from "@/lib/api/pagination";
import type { InviteUserRequest, UserProfile } from "@/types/api";

/**
 * User/invitation server state (backend `app/api/routers/users.py`).
 * Backend source of truth: `POST /users/invite` and `GET /users`.
 * Mutations invalidate the list key so pending/status updates appear live.
 */

export const USERS_KEY = "users";

export const usersListKey = (params: PageParams = {}) => [USERS_KEY, "list", params] as const;

/** GET /users — paginated users for the current org, normalized to `Paginated<UserProfile>`. */
export async function fetchUsers(params: PageParams = {}): Promise<Paginated<UserProfile>> {
  const query = pageParamsToQuery(params);
  const result = await apiClient.get<unknown>(`/api/v1/users${query ? `?${query}` : ""}`);
  return normalizePaginated<UserProfile>(result.data);
}

/** POST /users/invite — invite a user by email with role (requires `USER_WRITE`; org_admin). */
export async function inviteUser(payload: InviteUserRequest): Promise<UserProfile> {
  const result = await apiClient.post<UserProfile>("/api/v1/users/invite", payload);
  return result.data;
}

/** DELETE /users/{id} — deactivate (soft-delete); contributions preserved, access revoked. */
export async function deactivateUser(id: string): Promise<UserProfile> {
  const result = await apiClient.delete<UserProfile>(`/api/v1/users/${id}`);
  return result.data;
}

/** POST /users/{id}/reactivate — restore access for a deactivated user. */
export async function reactivateUser(id: string): Promise<UserProfile> {
  const result = await apiClient.post<UserProfile>(`/api/v1/users/${id}/reactivate`);
  return result.data;
}

/** List users (admin). */
export function useUsers(params: PageParams = {}) {
  return useQuery({
    queryKey: usersListKey(params),
    queryFn: () => fetchUsers(params),
  });
}

/** Invite a user; invalidates `['users','list']` so the new invite appears immediately. */
export function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InviteUserRequest) => inviteUser(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
    },
  });
}

/** Deactivate ↔ reactivate a user; invalidates the list so the row status updates live. */
export function useToggleUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; isActive: boolean }) =>
      input.isActive ? deactivateUser(input.id) : reactivateUser(input.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
    },
  });
}
