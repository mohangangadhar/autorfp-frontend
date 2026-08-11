import { describe, expect, it } from "vitest";
import { organizationSchema, toCreateRequest, type OrganizationFormValues } from "./schemas";
import { suggestSlug } from "./slug";
import { statusTone } from "./status-chip";

const validValues: OrganizationFormValues = {
  name: "Acme Corporation",
  slug: "acme-corporation",
  settings: {
    branding: { primary_color: "#1d4ed8", secondary_color: "#0f172a" },
    thresholds: { coverage_threshold: 80, confidence_threshold: 70 },
    workflow: { require_approval: true },
  },
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

  it("rejects malformed hex colors", () => {
    const result = organizationSchema.safeParse({
      ...validValues,
      settings: {
        ...validValues.settings,
        branding: { ...validValues.settings.branding, primary_color: "blue" },
      },
    });
    expect(result.success).toBe(false);
  });
});

describe("toCreateRequest", () => {
  it("maps validated values to the snake_case POST body under `settings`", () => {
    const request = toCreateRequest(validValues);
    expect(request).toEqual({
      name: "Acme Corporation",
      slug: "acme-corporation",
      settings: {
        branding: { primary_color: "#1d4ed8", secondary_color: "#0f172a" },
        thresholds: { coverage_threshold: 80, confidence_threshold: 70 },
        workflow: { require_approval: true },
      },
    });
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
