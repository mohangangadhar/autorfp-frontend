"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { FullPageLoader } from "@/components/shared/loaders";

/**
 * Client session guard for authenticated surfaces. Redirects anonymous
 * users to `/login?next=<current>` — presence-check only (API enforces).
 */
export function SessionGuard({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const redirected = React.useRef(false);

  React.useEffect(() => {
    if (status === "unauthenticated" && !redirected.current) {
      redirected.current = true;
      const next = window.location.pathname + window.location.search;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [status, router]);

  if (status === "loading") return <FullPageLoader />;
  if (status === "unauthenticated") return null;
  return <>{children}</>;
}