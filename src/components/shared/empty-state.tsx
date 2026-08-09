import * as React from "react";
import { PackageOpen } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/** Empty state — region renders an EmptyState instead of nothing. */
export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong px-6 py-12 text-center",
        className,
      )}
      data-testid="empty-state"
    >
      <PackageOpen aria-hidden className="size-10 text-muted" />
      <h3 className="text-base font-semibold text-primary">{title}</h3>
      {description ? <p className="max-w-sm text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}