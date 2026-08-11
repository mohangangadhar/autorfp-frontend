import { beforeEach, describe, expect, it, vi } from "vitest";

const apiClient = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({ apiClient }));

const queryClient = vi.hoisted(() => ({ invalidateQueries: vi.fn() }));

vi.mock("@tanstack/react-query", () => ({
  useMutation: (options: {
    mutationFn: (input: unknown) => Promise<unknown>;
    onSuccess?: (data: unknown, input: unknown) => void;
  }) => ({
    mutateAsync: async (input: unknown) => {
      const result = await options.mutationFn(input);
      options.onSuccess?.(result, input);
      return result;
    },
  }),
  useQueryClient: () => queryClient,
}));

import {
  createRole,
  deleteRole,
  fetchRole,
  fetchRoles,
  updateRole,
  useCreateRole,
  useDeleteRole,
  useUpdateRole,
} from "./roles";

const ROLE_BODY = { id: "role_1", organization_id: "org_1", name: "Analyst", description: null, is_predefined: false, permission_bitmap: 3, created_at: "2026-08-01T00:00:00Z", updated_at: null };

describe("role API functions", () => {
  beforeEach(() => {
    apiClient.get.mockReset();
    apiClient.post.mockReset();
    apiClient.put.mockReset();
    apiClient.delete.mockReset();
    queryClient.invalidateQueries.mockReset();
  });

  it("fetches roles via GET /api/v1/roles and normalizes pagination", async () => {
    apiClient.get.mockResolvedValue({ data: { items: [ROLE_BODY], total: 1, page: 1, per_page: 20, total_pages: 1 } });
    const result = await fetchRoles();
    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/roles");
    expect(result).toEqual({ items: [ROLE_BODY], total: 1, page: 1, perPage: 20, totalPages: 1 });
  });

  it("serializes pagination params", async () => {
    apiClient.get.mockResolvedValue({ data: { items: [], total: 0 } });
    await fetchRoles({ page: 2, perPage: 50 });
    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/roles?page=2&per_page=50");
  });

  it("fetches a single role via GET /api/v1/roles/{id}", async () => {
    apiClient.get.mockResolvedValue({ data: ROLE_BODY });
    await fetchRole("role_1");
    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/roles/role_1");
  });

  it("creates a role via POST /api/v1/roles", async () => {
    apiClient.post.mockResolvedValue({ data: ROLE_BODY });
    await createRole({ name: "Analyst", description: null, permission_bitmap: 3 });
    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/roles", {
      name: "Analyst",
      description: null,
      permission_bitmap: 3,
    });
  });

  it("updates a role via PUT /api/v1/roles/{id}", async () => {
    apiClient.put.mockResolvedValue({ data: ROLE_BODY });
    await updateRole("role_1", { name: "Analyst II", permission_bitmap: 7 });
    expect(apiClient.put).toHaveBeenCalledWith("/api/v1/roles/role_1", {
      name: "Analyst II",
      permission_bitmap: 7,
    });
  });

  it("deletes a role via DELETE /api/v1/roles/{id}", async () => {
    apiClient.delete.mockResolvedValue({ data: null });
    await deleteRole("role_1");
    expect(apiClient.delete).toHaveBeenCalledWith("/api/v1/roles/role_1");
  });

  it("create mutation invalidates the roles list", async () => {
    apiClient.post.mockResolvedValue({ data: ROLE_BODY });

    const mutation = useCreateRole();
    await mutation.mutateAsync({ name: "Analyst", description: null, permission_bitmap: 3 });

    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/roles", {
      name: "Analyst",
      description: null,
      permission_bitmap: 3,
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["roles"] });
  });

  it("update mutation invalidates the list and the edited role detail", async () => {
    apiClient.put.mockResolvedValue({ data: ROLE_BODY });

    const mutation = useUpdateRole();
    await mutation.mutateAsync({ id: "role_1", payload: { permission_bitmap: 7 } });

    expect(apiClient.put).toHaveBeenCalledWith("/api/v1/roles/role_1", { permission_bitmap: 7 });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["roles"] });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["roles", "detail", "role_1"] });
  });

  it("delete mutation invalidates the roles list", async () => {
    apiClient.delete.mockResolvedValue({ data: null });

    const mutation = useDeleteRole();
    await mutation.mutateAsync("role_1");

    expect(apiClient.delete).toHaveBeenCalledWith("/api/v1/roles/role_1");
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["roles"] });
  });
});
