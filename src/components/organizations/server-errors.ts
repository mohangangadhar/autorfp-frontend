import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { toAppError, type AppError } from "@/lib/api/error";

/**
 * Map server 422/RFC9457 field errors back onto the form (forms-design §3).
 * Only paths the form knows about are set; unknown paths are ignored so a
 * backend response never crashes the UI.
 */
export function applyServerErrors<T extends FieldValues>(
  form: UseFormReturn<T>,
  error: unknown,
): boolean {
  const appError = toAppError(error);
  if (appError.code === "UNAUTHORIZED" || appError.code === "NETWORK") return false;

  let applied = false;
  for (const field of appError.fieldErrors) {
    const path = field.field;
    if (!path) continue;
    try {
      form.setError(path as Path<T>, { type: "server", message: field.message });
      applied = true;
    } catch {
      // path not present in this form — ignore
    }
  }
  return applied;
}

/** Normalize any thrown value to `AppError` (409 conflict handling in the wizard). */
export { toAppError, type AppError };
