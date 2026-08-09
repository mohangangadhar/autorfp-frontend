"use client";

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/state/query-client";

/**
 * Query provider mounting the TanStack cache. The client is built once
 * per render tree (per request on the server) to avoid cross-request
 * cache leaks; client-side is a stable singleton thereafter.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => makeQueryClient());
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}