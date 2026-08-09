"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-canvas p-6 font-sans text-primary">
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
          <h1 className="text-xl font-semibold">A fatal error occurred</h1>
          <p className="max-w-md text-sm text-muted">
            Please reload the page to continue. Reference: {error?.digest ?? "unknown"}.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-subtle px-4 py-2 text-sm font-medium text-primary hover:bg-inset"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}