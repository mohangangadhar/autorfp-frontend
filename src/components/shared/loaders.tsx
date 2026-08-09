"use client";

import { Skeleton } from "@/components/ui/skeleton";

/** Full-page loading placeholder (LEES L1) — never a blank screen. */
export function FullPageLoader({ label }: { label?: string }) {
  return (
    <div
      role="status"
      aria-label={label ?? "Loading"}
      className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6"
      data-testid="full-page-loader"
    >
      <div className="flex items-center gap-2 text-sm text-muted">
        <Spinner />
        {label ?? "Loading…"}
      </div>
    </div>
  );
}

/** Inline loader for content regions. */
export function InlineLoader({ label }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-2 py-4 text-sm text-muted">
      <Spinner />
      {label ?? "Loading…"}
    </div>
  );
}

function Spinner() {
  return (
    <span aria-hidden className="relative block size-4">
      <span className="absolute inset-0 rounded-full border-2 border-current opacity-25" />
      <span className="absolute inset-0 animate-spin rounded-full border-2 border-t-transparent border-current" />
    </span>
  );
}

/** Skeleton-shaped page placeholder used while a route streams. */
export function PageSkeleton({ lines = 6 }: { lines?: number }) {
  return (
    <div className="space-y-4 p-6" data-testid="page-skeleton">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}