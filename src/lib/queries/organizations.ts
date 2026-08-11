"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import {
  normalizePaginated,
  pageParamsToQuery,
  type PageParams,
  type Paginated,
} from "@/lib/api/pagination";
import type {
  OrganizationCreateRequest,
  OrganizationDto,
  OrganizationStatusUpdateRequest,
} from "@/types/api";

/**
 * Organization server state (contract §7.1 `/organizations`).
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

/** POST /organizations — `public` skips the Bearer header for the self-service wizard. */
export async function createOrganization(
  payload: OrganizationCreateRequest,
  options: { public?: boolean } = {},
): Promise<OrganizationDto> {
  const result = await apiClient.post<OrganizationDto>("/api/v1/organizations", payload, {
    public: options.public ?? false,
  });
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
export function useCreateOrganization(options: { public?: boolean } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OrganizationCreateRequest) => createOrganization(payload, options),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [ORGANIZATIONS_KEY] });
    },
  });
}

/** PATCH /organizations/{id} — lifecycle status change (TDD-020 state machine). */
export async function updateOrganizationStatus(
  id: string,
  payload: OrganizationStatusUpdateRequest,
): Promise<OrganizationDto> {
  const result = await apiClient.patch<OrganizationDto>(`/api/v1/organizations/${id}`, payload);
  return result.data;
}

/** Toggle an organization's lifecycle status; invalidates the list so chips update live. */
export function useToggleOrgStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; status: OrganizationStatusUpdateRequest["status"] }) =>
      updateOrganizationStatus(input.id, { status: input.status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [ORGANIZATIONS_KEY] });
    },
  });
}
