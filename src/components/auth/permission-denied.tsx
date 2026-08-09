"use client";

import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Freefloating 403 panel (routing-design §1.3, authorization-design §4).
 */
export function PermissionDenied() {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center"
      data-testid="permission-denied"
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-danger-bg text-danger-text">
        <ShieldX aria-hidden className="size-7" />
      </span>
      <div>
        <h1 className="text-xl font-semibold text-primary">Permission denied</h1>
        <p className="mt-1 max-w-md text-sm text-muted">
          You don&apos;t have access to this area. If you believe this is a mistake, contact your
          organization administrator or visit settings.
        </p>
      </div>
      <Button asChild variant="secondary">
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}