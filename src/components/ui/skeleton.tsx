import * as React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Skeleton placeholder. Mirrors the layout shape of the content it
 * replaces so regions never jump on load (LEES L1/L6).
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-inset", className)} {...props} />;
}

export function SkeletonLine({ className }: { className?: string }) {
  return <Skeleton className={cn("h-4 w-full", className)} />;
}

export function SkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden data-testid="skeleton-table">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonLine className="w-2/3" />
            <SkeletonLine className="w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}