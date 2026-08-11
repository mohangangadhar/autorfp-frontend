import { beforeEach, describe, expect, it, vi } from "vitest";

const apiClient = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({ apiClient }));

import { fetchUsers, inviteUser, useInviteUser, useToggleUserStatus, deactivateUser, reactivateUser } from "./users";

const queryClient = vi.hoisted(() => ({ invalidateQueries: vi.fn() }));

vi.mock("@tanstack/react-query", () => ({
  useMutation: (options: { mutationFn: (input: unknown) => unknown; onSuccess: () => void }) => ({
    mutateAsync: async (input: unknown) => {
      const result = await options.mutationFn(input);
      options.onSuccess();
      return result;
    },
  }),
  useQueryClient: () => queryClient,
}));

describe("user API functions", () => {
  beforeEach(() => {
    apiClient.get.mockReset();
    apiClient.post.mockReset();
    apiClient.delete.mockReset();
    queryClient.invalidateQueries.mockReset();
  });

  it("fetches users via GET /api/v1/users", async () => {
    apiClient.get.mockResolvedValue({ data: { items: [], total: 0 } });
    await fetchUsers();
    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/users");
  });

  it("serializes pagination params", async () => {
    apiClient.get.mockResolvedValue({ data: { items: [], total: 0 } });
    await fetchUsers({ page: 2, perPage: 50 });
    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/users?page=2&per_page=50");
  });

  it("invites via POST /api/v1/users/invite with email/name/role", async () => {
    apiClient.post.mockResolvedValue({ data: { id: "u_1" } });
    await inviteUser({ email: "a@b.com", name: "Alice", role: "editor" });
    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/users/invite", {
      email: "a@b.com",
      name: "Alice",
      role: "editor",
    });
  });

  it("invite mutation invalidates the users list", async () => {
    apiClient.post.mockResolvedValue({ data: { id: "u_1" } });

    const mutation = useInviteUser();
    await mutation.mutateAsync({ email: "a@b.com", name: "Alice", role: "viewer" });

    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/users/invite", {
      email: "a@b.com",
      name: "Alice",
      role: "viewer",
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["users"] });
  });

  it("deactivates via DELETE /api/v1/users/{id} (soft-delete, no data loss)", async () => {
    apiClient.delete.mockResolvedValue({ data: { id: "u_1", is_active: false } });
    await deactivateUser("u_1");
    expect(apiClient.delete).toHaveBeenCalledWith("/api/v1/users/u_1");
  });

  it("reactivates via POST /api/v1/users/{id}/reactivate", async () => {
    apiClient.post.mockResolvedValue({ data: { id: "u_1", is_active: true } });
    await reactivateUser("u_1");
    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/users/u_1/reactivate");
  });

  it("toggle mutation deactivates an active user and invalidates the list", async () => {
    apiClient.delete.mockResolvedValue({ data: { id: "u_1", is_active: false } });

    const mutation = useToggleUserStatus();
    await mutation.mutateAsync({ id: "u_1", isActive: true });

    expect(apiClient.delete).toHaveBeenCalledWith("/api/v1/users/u_1");
    expect(apiClient.post).not.toHaveBeenCalled();
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["users"] });
  });

  it("toggle mutation reactivates an inactive user and invalidates the list", async () => {
    apiClient.post.mockResolvedValue({ data: { id: "u_1", is_active: true } });

    const mutation = useToggleUserStatus();
    await mutation.mutateAsync({ id: "u_1", isActive: false });

    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/users/u_1/reactivate");
    expect(apiClient.delete).not.toHaveBeenCalled();
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["users"] });
  });
});
