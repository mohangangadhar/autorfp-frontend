"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center"
      role="alert"
      data-testid="error-boundary"
    >
      <h1 className="text-xl font-semibold text-primary">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted">
        An unexpected error occurred while rendering this page.
        {error.digest ? <span className="block pt-1 text-xs">Reference: {error.digest}</span> : null}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-subtle px-4 py-2 text-sm font-medium text-primary hover:bg-inset"
      >
        Try again
      </button>
    </div>
  );
}