import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

/**
 * Checkbox primitive — native input styled with design tokens. Keeps the
 * built-in keyboard + form semantics; used by the PermissionMatrix.
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, invalid, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        className={cn(
          "size-4 shrink-0 cursor-pointer rounded border border-border-strong bg-surface text-brand-500 shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-danger",
          className,
        )}
        aria-invalid={invalid ? true : undefined}
        ref={ref}
        {...props}
      />
    );
  },
);
Checkbox.displayName = "Checkbox";
