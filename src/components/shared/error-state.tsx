"use client";

import { Button } from "@/components/ui/button";
import type { AppError } from "@/lib/api/error";

interface ErrorStateProps {
  error: unknown;
  title?: string;
  onRetry?: () => void;
}

/**
 * Page-level data error with a retry button and, when available, the
 * correlation trace id for support hand-off. Never shows raw exception
 * text — only the user-safe message. (error-handling §3)
 */
export function ErrorState({ error, title = "Something went wrong", onRetry }: ErrorStateProps) {
  const appError = error instanceof Error ? (error as AppError) : undefined;
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-surface px-6 py-12 text-center"
      data-testid="error-state"
    >
      <span aria-hidden className="text-danger flex size-12 items-center justify-center rounded-full bg-danger-bg">
        <MessageIcon />
      </span>
      <h3 className="text-base font-semibold text-primary">{title}</h3>
      <p className="max-w-md text-sm text-muted">{appError?.userMessage ?? "Please try again."}</p>
      {appError?.traceId ? (
        <p className="font-mono text-xs text-muted" data-testid="error-trace">
          Trace: {appError.traceId}
        </p>
      ) : null}
      {onRetry ? (
        <Button className="mt-2" variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}

function MessageIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M12 8v4m0 4h.01" strokeLinecap="round" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}