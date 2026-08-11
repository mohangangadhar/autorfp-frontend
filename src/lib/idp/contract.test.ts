import { describe, expect, it } from "vitest";
import {
  isSaml,
  maskClientSecret,
  normalizeAttributeMapping,
  normalizeIdpList,
  validateCertificate,
} from "./contract";
import type { IdpConfigDto } from "@/types/api";

function idp(partial: Partial<IdpConfigDto>): IdpConfigDto {
  return {
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
    ...partial,
  };
}

describe("isSaml", () => {
  it("is true only for the saml protocol", () => {
    expect(isSaml("saml")).toBe(true);
    expect(isSaml("oidc")).toBe(false);
  });
});

describe("validateCertificate", () => {
  it("allows an empty certificate (optional field)", () => {
    expect(validateCertificate("")).toBeNull();
    expect(validateCertificate("   ")).toBeNull();
  });

  it("rejects text without a PEM begin marker", () => {
    expect(validateCertificate("not a cert")).toContain("BEGIN CERTIFICATE");
  });

  it("rejects a certificate missing the end marker", () => {
    expect(validateCertificate("-----BEGIN CERTIFICATE-----\nMIIB")).toContain("END CERTIFICATE");
  });

  it("accepts a well-formed PEM block", () => {
    const pem = "-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----";
    expect(validateCertificate(pem)).toBeNull();
  });
});

describe("normalizeIdpList", () => {
  it("passes through a bare array", () => {
    expect(normalizeIdpList([idp({})])).toEqual([idp({})]);
  });

  it("extracts items from an { items: [] } envelope", () => {
    expect(normalizeIdpList({ items: [idp({})] })).toEqual([idp({})]);
  });

  it("returns an empty list for unexpected shapes", () => {
    expect(normalizeIdpList(null)).toEqual([]);
    expect(normalizeIdpList({})).toEqual([]);
    expect(normalizeIdpList("nope")).toEqual([]);
  });
});

describe("maskClientSecret", () => {
  it("masks everything but the last 4 characters", () => {
    expect(maskClientSecret("superSecret1234")).toBe("••••1234");
  });

  it("fully masks short secrets", () => {
    expect(maskClientSecret("ab")).toBe("••••");
    expect(maskClientSecret("abcd")).toBe("••••");
  });

  it("returns an empty string for blank input", () => {
    expect(maskClientSecret("")).toBe("");
  });
});

describe("normalizeAttributeMapping", () => {
  it("drops blank provider attributes and local fields", () => {
    expect(
      normalizeAttributeMapping({
        "": "email",
        "  ": "name",
        email: "email",
        name: "  ",
      }),
    ).toEqual({ email: "email" });
  });

  it("trims keys and values", () => {
    expect(normalizeAttributeMapping({ " uid ": " email " })).toEqual({ uid: "email" });
  });
});
