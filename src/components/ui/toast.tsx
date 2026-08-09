"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const ToastProvider = ToastPrimitive.Provider;

export const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      "fixed bottom-0 right-0 z-toast flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-sm",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = "ToastViewport";

export const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & {
    tone?: "default" | "success" | "warning" | "danger" | "info";
  }
>(({ className, tone = "default", ...props }, ref) => (
  <ToastPrimitive.Root
    ref={ref}
    className={cn(
      "pointer-events-auto relative flex w-full items-start justify-between gap-3 rounded-md border border-border bg-raised p-4 text-sm text-primary shadow-overlay data-[swipe=end]:opacity-0",
      tone === "success" && "border-success/60",
      tone === "warning" && "border-warning/60",
      tone === "danger" && "border-danger/60",
      tone === "info" && "border-info/60",
      className,
    )}
    {...props}
  />
));
Toast.displayName = "Toast";

export const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn(
      "rounded-sm p-0.5 text-muted transition-colors hover:text-primary focus:outline-2",
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="size-4" />
  </ToastPrimitive.Close>
));
ToastClose.displayName = "ToastClose";

export const ToastTitle = ToastPrimitive.Title;
export const ToastDescription = ToastPrimitive.Description;

export { ToastProvider };

interface ToasterProps {
  duration?: number;
}

/** Mounts the toast viewport (used once in the root layout). */
export function Toaster({ duration = 5000 }: ToasterProps) {
  return (
    <ToastProvider swipeDirection="right" duration={duration} label="Notifications">
      <ToastViewport />
    </ToastProvider>
  );
}