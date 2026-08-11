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
  createIdp,
  deleteIdp,
  fetchIdp,
  fetchIdps,
  idpDetailKey,
  idpsListKey,
  testConnection,
  updateIdp,
  useCreateIdp,
  useDeleteIdp,
  useIdpTestConnection,
  useUpdateIdp,
} from "./idp";

const IDP_BODY = {
  id: "idp_1",
  organization_id: "org_1",
  protocol: "saml",
  name: "Okta",
  issuer: "https://okta.example.com",
  metadata_url: null,
  certificate: null,
  client_id: null,
  client_secret: null,
  attribute_mapping: { email: "email" },
  enabled: true,
  created_at: "2026-08-01T00:00:00Z",
  updated_at: null,
};

const TEST_BODY = {
  success: true,
  message: "Connected",
  status: "ok",
  checked_at: "2026-08-01T00:00:00Z",
  details: { issuer: "https://okta.example.com" },
};

describe("IdP API functions", () => {
  beforeEach(() => {
    apiClient.get.mockReset();
    apiClient.post.mockReset();
    apiClient.put.mockReset();
    apiClient.delete.mockReset();
    queryClient.invalidateQueries.mockReset();
  });

  it("fetches identity providers via GET /api/v1/idp and normalizes the list", async () => {
    apiClient.get.mockResolvedValue({ data: { items: [IDP_BODY] } });
    const result = await fetchIdps();
    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/idp");
    expect(result).toEqual([IDP_BODY]);
  });

  it("fetches a single provider via GET /api/v1/idp/{id}", async () => {
    apiClient.get.mockResolvedValue({ data: IDP_BODY });
    await fetchIdp("idp_1");
    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/idp/idp_1");
  });

  it("creates a provider via POST /api/v1/idp", async () => {
    apiClient.post.mockResolvedValue({ data: IDP_BODY });
    await createIdp({
      protocol: "saml",
      name: "Okta",
      issuer: "https://okta.example.com",
      attribute_mapping: { email: "email" },
      enabled: true,
    });
    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/idp", {
      protocol: "saml",
      name: "Okta",
      issuer: "https://okta.example.com",
      attribute_mapping: { email: "email" },
      enabled: true,
    });
  });

  it("updates a provider via PUT /api/v1/idp/{id}", async () => {
    apiClient.put.mockResolvedValue({ data: IDP_BODY });
    await updateIdp("idp_1", { enabled: false });
    expect(apiClient.put).toHaveBeenCalledWith("/api/v1/idp/idp_1", { enabled: false });
  });

  it("deletes a provider via DELETE /api/v1/idp/{id}", async () => {
    apiClient.delete.mockResolvedValue({ data: null });
    await deleteIdp("idp_1");
    expect(apiClient.delete).toHaveBeenCalledWith("/api/v1/idp/idp_1");
  });

  it("tests a connection via POST /api/v1/idp/test-connection", async () => {
    apiClient.post.mockResolvedValue({ data: TEST_BODY });
    await testConnection("idp_1");
    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/idp/test-connection", { id: "idp_1" });
  });

  it("query keys follow the list/detail convention", () => {
    expect(idpsListKey()).toEqual(["idp", "list"]);
    expect(idpDetailKey("idp_1")).toEqual(["idp", "detail", "idp_1"]);
  });

  it("create mutation invalidates the idp list", async () => {
    apiClient.post.mockResolvedValue({ data: IDP_BODY });

    const mutation = useCreateIdp();
    await mutation.mutateAsync({ protocol: "saml", name: "Okta", issuer: "https://okta.example.com", attribute_mapping: {}, enabled: true });

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["idp"] });
  });

  it("update mutation invalidates the list and the edited provider detail", async () => {
    apiClient.put.mockResolvedValue({ data: IDP_BODY });

    const mutation = useUpdateIdp();
    await mutation.mutateAsync({ id: "idp_1", payload: { enabled: false } });

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["idp"] });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["idp", "detail", "idp_1"] });
  });

  it("delete mutation invalidates the idp list", async () => {
    apiClient.delete.mockResolvedValue({ data: null });

    const mutation = useDeleteIdp();
    await mutation.mutateAsync("idp_1");

    expect(apiClient.delete).toHaveBeenCalledWith("/api/v1/idp/idp_1");
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["idp"] });
  });

  it("test-connection mutation calls the endpoint without invalidating", async () => {
    apiClient.post.mockResolvedValue({ data: TEST_BODY });

    const mutation = useIdpTestConnection();
    const result = await mutation.mutateAsync("idp_1");

    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/idp/test-connection", { id: "idp_1" });
    expect(result).toEqual(TEST_BODY);
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
  });
});
