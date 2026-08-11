"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { normalizeIdpList } from "@/lib/idp/contract";
import type {
  IdpConfigDto,
  IdpCreateRequest,
  IdpUpdateRequest,
  TestConnectionResponse,
} from "@/types/api";

/**
 * Identity provider server state (US-001-03-01).
 *
 * Backend contract is the documented `/api/v1/idp` CRUD +
 * `POST /api/v1/idp/test-connection`. The endpoints are not implemented in
 * the backend yet — calls will surface the backend's 404 through `AppError`
 * and the LEES error/empty states. Mutations invalidate the list key so the
 * IdP list stays live.
 */

export const IDPS_KEY = "idp";

export const idpsListKey = () => [IDPS_KEY, "list"] as const;

export const idpDetailKey = (id: string) => [IDPS_KEY, "detail", id] as const;

/** GET /idp — identity providers for the current org (bare list or `{items}`). */
export async function fetchIdps(): Promise<IdpConfigDto[]> {
  const result = await apiClient.get<unknown>("/api/v1/idp");
  return normalizeIdpList(result.data);
}

/** GET /idp/{id} — single provider detail. */
export async function fetchIdp(id: string): Promise<IdpConfigDto> {
  const result = await apiClient.get<IdpConfigDto>(`/api/v1/idp/${id}`);
  return result.data;
}

/** POST /idp — create a provider (SAML or OIDC). */
export async function createIdp(payload: IdpCreateRequest): Promise<IdpConfigDto> {
  const result = await apiClient.post<IdpConfigDto>("/api/v1/idp", payload);
  return result.data;
}

/** PUT /idp/{id} — update provider configuration. */
export async function updateIdp(id: string, payload: IdpUpdateRequest): Promise<IdpConfigDto> {
  const result = await apiClient.put<IdpConfigDto>(`/api/v1/idp/${id}`, payload);
  return result.data;
}

/** DELETE /idp/{id} — delete a provider. */
export async function deleteIdp(id: string): Promise<void> {
  await apiClient.delete<undefined>(`/api/v1/idp/${id}`);
}

/** POST /idp/test-connection — validate a saved provider's reachability. */
export async function testConnection(id: string): Promise<TestConnectionResponse> {
  const result = await apiClient.post<TestConnectionResponse>("/api/v1/idp/test-connection", {
    id,
  });
  return result.data;
}

/** List identity providers (admin). */
export function useIdps() {
  return useQuery({
    queryKey: idpsListKey(),
    queryFn: fetchIdps,
  });
}

/** Single identity provider (admin). */
export function useIdp(id: string) {
  return useQuery({
    queryKey: idpDetailKey(id),
    queryFn: () => fetchIdp(id),
    enabled: Boolean(id),
  });
}

/** Create a provider; invalidates the list. */
export function useCreateIdp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: IdpCreateRequest) => createIdp(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [IDPS_KEY] });
    },
  });
}

/** Update a provider; invalidates the list + detail. */
export function useUpdateIdp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; payload: IdpUpdateRequest }) =>
      updateIdp(input.id, input.payload),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: [IDPS_KEY] });
      void queryClient.invalidateQueries({ queryKey: idpDetailKey(input.id) });
    },
  });
}

/** Delete a provider; invalidates the list. */
export function useDeleteIdp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteIdp(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [IDPS_KEY] });
    },
  });
}

/** Test a provider connection; the result (success/failure) stays local to the caller. */
export function useIdpTestConnection() {
  return useMutation({
    mutationFn: (id: string) => testConnection(id),
  });
}
