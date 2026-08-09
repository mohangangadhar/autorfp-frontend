import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        neutral: "bg-subtle text-secondary",
        success: "bg-success-bg text-success-text",
        warning: "bg-warning-bg text-warning-text",
        danger: "bg-danger-bg text-danger-text",
        info: "bg-info-bg text-info-text",
        brand: "bg-brand-500 text-on-brand",
        ai: "bg-ai-bg text-ai border border-ai-border",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

const statusToneMap = {
  pending: "neutral",
  processing: "info",
  running: "info",
  completed: "success",
  done: "success",
  ready: "success",
  succeeded: "success",
  failed: "danger",
  error: "danger",
  declined: "danger",
  canceled: "neutral",
  cancelled: "neutral",
  locked: "warning",
  draft: "neutral",
  archived: "neutral",
} as const;

/**
 * Adapter that maps backend status strings to badge tones so no
 * shared component hard-codes a status. Unknown statuses fall back to
 * neutral. (ui/22-status-indicators.md)
 */
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = statusTone(status);
  return <Badge tone={tone} className={className}>{status}</Badge>;
}

export function statusTone(status: string): BadgeProps["tone"] {
  const key = status.toLowerCase() as keyof typeof statusToneMap;
  return statusToneMap[key] ?? "neutral";
}