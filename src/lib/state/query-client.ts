import { QueryClient } from "@tanstack/react-query";

/**
 * QueryClient factory with platform defaults (state-management-design §2.1).
 * `staleTime` 30s lists / 5min reference / 0 volatile; mutations never
 * auto-retried; safe reads retry ×2 with 500ms→10s backoff.
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 10_000),
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        throwOnError: false,
      },
      mutations: {
        retry: false,
        throwOnError: true,
      },
    },
  });
}

/** Slow-reference-data stale time (5 min): frameworks, role matrices… */
export const STALE_REFERENCE = 5 * 60_000;

/** Volatile stale time (0) for unread counts and job status. */
export const STALE_VOLATILE = 0;