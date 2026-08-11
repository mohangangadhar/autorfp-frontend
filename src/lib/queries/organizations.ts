"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import {
  normalizePaginated,
  pageParamsToQuery,
  type PageParams,
  type Paginated,
} from "@/lib/api/pagination";
import type { OrganizationCreateRequest, OrganizationDto, OrganizationStatus } from "@/types/api";

/**
 * Organization server state (backend `app/api/routers/organizations.py`).
 * Query + mutation hooks; wizard form state stays with the form
 * (state-management-design §2). Mutations invalidate the list key.
 */

export const ORGANIZATIONS_KEY = "organizations";

export const organizationsListKey = (params: PageParams = {}) =>
  [ORGANIZATIONS_KEY, "list", params] as const;

/** GET /organizations — paginated, normalized to `Paginated<OrganizationDto>`. */
export async function fetchOrganizations(params: PageParams = {}): Promise<Paginated<OrganizationDto>> {
  const query = pageParamsToQuery(params);
  const result = await apiClient.get<unknown>(
    `/api/v1/organizations${query ? `?${query}` : ""}`,
  );
  return normalizePaginated<OrganizationDto>(result.data);
}

/** POST /organizations — creates an org (requires `ORG_WRITE`; Bearer via session). */
export async function createOrganization(payload: OrganizationCreateRequest): Promise<OrganizationDto> {
  const result = await apiClient.post<OrganizationDto>("/api/v1/organizations", payload);
  return result.data;
}

/** POST /organizations/{id}/suspend — lifecycle suspend (backend org_admin action). */
export async function suspendOrganization(id: string): Promise<OrganizationDto> {
  const result = await apiClient.post<OrganizationDto>(`/api/v1/organizations/${id}/suspend`);
  return result.data;
}

/** POST /organizations/{id}/reactivate — lifecycle reactivate. */
export async function reactivateOrganization(id: string): Promise<OrganizationDto> {
  const result = await apiClient.post<OrganizationDto>(`/api/v1/organizations/${id}/reactivate`);
  return result.data;
}

/** List organizations (admin). */
export function useOrganizations(params: PageParams = {}) {
  return useQuery({
    queryKey: organizationsListKey(params),
    queryFn: () => fetchOrganizations(params),
  });
}

/** Create an organization; invalidates `['organizations','list']` on success. */
export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OrganizationCreateRequest) => createOrganization(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [ORGANIZATIONS_KEY] });
    },
  });
}

/** Toggle an org's lifecycle status (suspend ↔ reactivate); invalidates the list so chips update live. */
export function useToggleOrgStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; status: Extract<OrganizationStatus, "suspended" | "active"> }) =>
      input.status === "suspended" ? suspendOrganization(input.id) : reactivateOrganization(input.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [ORGANIZATIONS_KEY] });
    },
  });
}
