"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import {
  normalizePaginated,
  pageParamsToQuery,
  type PageParams,
  type Paginated,
} from "@/lib/api/pagination";
import type { RoleCreateRequest, RoleDto, RoleUpdateRequest } from "@/types/api";

/**
 * Role server state (backend `app/api/routers/roles.py`).
 * Roles are org-scoped; predefined roles are immutable (backend 400).
 * Mutations invalidate the list key so permission edits appear live.
 */

export const ROLES_KEY = "roles";

export const rolesListKey = (params: PageParams = {}) => [ROLES_KEY, "list", params] as const;

export const roleDetailKey = (id: string) => [ROLES_KEY, "detail", id] as const;

/** GET /roles — paginated roles for the current org, normalized to `Paginated<RoleDto>`. */
export async function fetchRoles(params: PageParams = {}): Promise<Paginated<RoleDto>> {
  const query = pageParamsToQuery(params);
  const result = await apiClient.get<unknown>(`/api/v1/roles${query ? `?${query}` : ""}`);
  return normalizePaginated<RoleDto>(result.data);
}

/** GET /roles/{id} — role detail. */
export async function fetchRole(id: string): Promise<RoleDto> {
  const result = await apiClient.get<RoleDto>(`/api/v1/roles/${id}`);
  return result.data;
}

/** POST /roles — create a custom role (requires `ROLE_WRITE`; org_admin). */
export async function createRole(payload: RoleCreateRequest): Promise<RoleDto> {
  const result = await apiClient.post<RoleDto>("/api/v1/roles", payload);
  return result.data;
}

/** PUT /roles/{id} — update name/description/permission bitmap (custom roles only). */
export async function updateRole(id: string, payload: RoleUpdateRequest): Promise<RoleDto> {
  const result = await apiClient.put<RoleDto>(`/api/v1/roles/${id}`, payload);
  return result.data;
}

/** DELETE /roles/{id} — delete a custom role; assignments are removed by the backend. */
export async function deleteRole(id: string): Promise<void> {
  await apiClient.delete<undefined>(`/api/v1/roles/${id}`);
}

/** List roles (admin). */
export function useRoles(params: PageParams = {}) {
  return useQuery({
    queryKey: rolesListKey(params),
    queryFn: () => fetchRoles(params),
  });
}

/** Role detail (admin). */
export function useRole(id: string) {
  return useQuery({
    queryKey: roleDetailKey(id),
    queryFn: () => fetchRole(id),
    enabled: Boolean(id),
  });
}

/** Create a custom role; invalidates the list so the new role appears immediately. */
export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RoleCreateRequest) => createRole(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [ROLES_KEY] });
    },
  });
}

/** Update a custom role; invalidates the list + detail so edits propagate. */
export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; payload: RoleUpdateRequest }) =>
      updateRole(input.id, input.payload),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: [ROLES_KEY] });
      void queryClient.invalidateQueries({ queryKey: roleDetailKey(input.id) });
    },
  });
}

/** Delete a custom role; invalidates the list. */
export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRole(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [ROLES_KEY] });
    },
  });
}
