/**
 * IdP domain helpers (US-001-03-01).
 *
 * Frontend-side contract for `/api/v1/idp` (CRUD + test-connection). The
 * backend endpoints are not implemented yet (`auth.py`), so normalization,
 * cert validation and secret masking live here as agreed UI-side rules.
 */
import type { AttributeMapping, IdpConfigDto, IdpProtocol } from "@/types/api";

export const IDP_PROTOCOLS: readonly IdpProtocol[] = ["saml", "oidc"];

/** Local user fields an IdP attribute can map onto (attribute-map builder). */
export const LOCAL_ATTRIBUTE_FIELDS = ["email", "name", "role", "groups"] as const;
export type LocalAttributeField = (typeof LOCAL_ATTRIBUTE_FIELDS)[number];

/** True when the protocol is SAML 2.0. */
export function isSaml(protocol: IdpProtocol): boolean {
  return protocol === "saml";
}

/**
 * Validate a pasted PEM certificate. Empty is allowed (optional field);
 * otherwise it must contain BEGIN/END CERTIFICATE markers.
 */
export function validateCertificate(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (!/-----BEGIN CERTIFICATE-----/.test(trimmed)) {
    return "Paste the full PEM certificate (starts with -----BEGIN CERTIFICATE-----).";
  }
  if (!/-----END CERTIFICATE-----/.test(trimmed)) {
    return "Certificate is missing the -----END CERTIFICATE----- marker.";
  }
  return null;
}

/** Normalize a `GET /idp` response (bare array or `{items: []}`). */
export function normalizeIdpList(raw: unknown): IdpConfigDto[] {
  if (Array.isArray(raw)) return raw as IdpConfigDto[];
  if (raw && typeof raw === "object" && Array.isArray((raw as { items?: unknown }).items)) {
    return (raw as { items: IdpConfigDto[] }).items;
  }
  return [];
}

/** Mask an OIDC client secret for display (keeps the last 4 chars). */
export function maskClientSecret(secret: string): string {
  if (!secret) return "";
  if (secret.length <= 4) return "••••";
  return `••••${secret.slice(-4)}`;
}

/** Drop empty rows so the attribute mapping never sends blank keys. */
export function normalizeAttributeMapping(mapping: AttributeMapping): AttributeMapping {
  const out: AttributeMapping = {};
  for (const [providerAttr, localField] of Object.entries(mapping)) {
    const key = providerAttr.trim();
    if (key && localField.trim()) out[key] = localField.trim();
  }
  return out;
}
