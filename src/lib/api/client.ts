import { createHttpClient } from "@/lib/api/http";
import { getAccessToken } from "@/lib/auth/token";
import { handleSessionExpired, refreshSession } from "@/lib/auth/bff";

/**
 * Shared transport instance used by all query hooks and mutations.
 * Transport-only: base URL, headers, auth, retries, timeout, error
 * mapping — zero domain knowledge (technical-frontend-architecture §4).
 */
export const apiClient = createHttpClient({
  getAccessToken,
  refreshToken: refreshSession,
  onUnauthorized: () => handleSessionExpired(),
});
