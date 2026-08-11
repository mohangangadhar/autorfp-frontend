import { beforeEach, describe, expect, it, vi } from "vitest";

const apiClient = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({ apiClient }));

import {
  createOrganization,
  reactivateOrganization,
  suspendOrganization,
  useToggleOrgStatus,
} from "./organizations";

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

describe("organization API functions", () => {
  beforeEach(() => {
    apiClient.post.mockReset();
    apiClient.patch.mockReset();
    queryClient.invalidateQueries.mockReset();
  });

  it("creates an organization via POST /api/v1/organizations", async () => {
    apiClient.post.mockResolvedValue({ data: { id: "org_1" } });
    await createOrganization({ name: "Acme", slug: "acme", settings: {} });
    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/organizations", {
      name: "Acme",
      slug: "acme",
      settings: {},
    });
  });

  it("suspends via POST /api/v1/organizations/{id}/suspend", async () => {
    apiClient.post.mockResolvedValue({ data: { id: "org_1" } });
    await suspendOrganization("org_1");
    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/organizations/org_1/suspend");
  });

  it("reactivates via POST /api/v1/organizations/{id}/reactivate", async () => {
    apiClient.post.mockResolvedValue({ data: { id: "org_1" } });
    await reactivateOrganization("org_1");
    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/organizations/org_1/reactivate");
  });

  it("routes the status toggle to suspend/reactivate and invalidates the list", async () => {
    apiClient.post.mockResolvedValue({ data: { id: "org_1" } });

    const mutation = useToggleOrgStatus();
    await mutation.mutateAsync({ id: "org_1", status: "suspended" });
    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/organizations/org_1/suspend");

    await mutation.mutateAsync({ id: "org_1", status: "active" });
    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/organizations/org_1/reactivate");

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["organizations"] });
  });
});
