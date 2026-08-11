import { describe, expect, it } from "vitest";
import { organizationSchema, toCreateRequest, type OrganizationFormValues } from "./schemas";
import { suggestSlug } from "./slug";
import { statusTone } from "./status-chip";

const validValues: OrganizationFormValues = {
  name: "Acme Corporation",
  slug: "acme-corporation",
  domain: "",
  region: "us-east",
  data_retention_days: 365,
  config: {
    branding: { primary_color: "#1d4ed8", secondary_color: "#0f172a" },
    thresholds: { coverage_threshold: 80, confidence_threshold: 70 },
    workflow: { require_approval: true },
  },
  admin: { name: "Ada Lovelace", email: "ada@acme.com", password: "supersecret" },
};

describe("organizationSchema", () => {
  it("accepts a valid tenant payload", () => {
    expect(organizationSchema.safeParse(validValues).success).toBe(true);
  });

  it("rejects an empty org name", () => {
    const result = organizationSchema.safeParse({ ...validValues, name: "  " });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path[0]).toBe("name");
    }
  });

  it("rejects a slug with spaces or uppercase", () => {
    const result = organizationSchema.safeParse({ ...validValues, slug: "Acme Corp" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid domains and accepts empty", () => {
    expect(organizationSchema.safeParse({ ...validValues, domain: "not a domain" }).success).toBe(false);
    expect(organizationSchema.safeParse({ ...validValues, domain: "" }).success).toBe(true);
    expect(organizationSchema.safeParse({ ...validValues, domain: "acme.com" }).success).toBe(true);
  });

  it("rejects a weak admin password", () => {
    const result = organizationSchema.safeParse({ ...validValues, admin: { ...validValues.admin, password: "short" } });
    expect(result.success).toBe(false);
  });

  it("keeps retention within 30–3650 days", () => {
    expect(organizationSchema.safeParse({ ...validValues, data_retention_days: 15 }).success).toBe(false);
    expect(organizationSchema.safeParse({ ...validValues, data_retention_days: 3650 }).success).toBe(true);
  });
});

describe("toCreateRequest", () => {
  it("maps validated values to the snake_case POST body and drops empty domain", () => {
    const request = toCreateRequest(validValues);
    expect(request).toMatchObject({
      name: "Acme Corporation",
      slug: "acme-corporation",
      region: "us-east",
      data_retention_days: 365,
      config: { branding: { primary_color: "#1d4ed8" } },
      admin: { email: "ada@acme.com" },
    });
    expect(request.domain).toBeUndefined();
  });
});

describe("suggestSlug", () => {
  it("lowercases, joins words and strips accents", () => {
    expect(suggestSlug("Acme Corporation")).toBe("acme-corporation");
    expect(suggestSlug("Müller & Sons GmbH")).toBe("muller-sons-gmbh");
    expect(suggestSlug("123")).toBe("123");
  });
});

describe("statusTone", () => {
  it("maps lifecycle states to badge tones and falls back to neutral", () => {
    expect(statusTone("provisioning")).toBe("info");
    expect(statusTone("active")).toBe("success");
    expect(statusTone("suspended")).toBe("warning");
    expect(statusTone("archived")).toBe("neutral");
    expect(statusTone("unknown")).toBe("neutral");
  });
});