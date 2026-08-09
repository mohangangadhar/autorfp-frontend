/**
 * Single-flight session refresh (authentication-design.md §2).
 * Multiple concurrent 401s share one rotation; queued callers await the
 * same promise.
 */

let inFlight: Promise<boolean> | null = null;

/** Run `refresh` once; concurrent callers share the same promise. */
export function runSingleFlight(refresh: () => Promise<boolean>): Promise<boolean> {
  if (!inFlight) {
    inFlight = refresh().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

/** Test hook — clear any pending in-flight refresh promise. */
export function __resetSingleFlight(): void {
  inFlight = null;
}