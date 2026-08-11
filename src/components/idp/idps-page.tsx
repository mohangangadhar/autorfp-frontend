"use client";

import { IdpList } from "./idp-list";

/**
 * `/admin/identity-providers` — configure SAML/OIDC providers (US-001-03-01).
 * Composes the LEES IdP list + editor; gating handled inside `IdpList`.
 */
export function IdpsPage() {
  return <IdpList />;
}
