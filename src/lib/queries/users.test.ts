import { beforeEach, describe, expect, it, vi } from "vitest";

const apiClient = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({ apiClient }));

import { fetchUsers, inviteUser, useInviteUser } from "./users";

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
});
