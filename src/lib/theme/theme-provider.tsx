"use client";

import * as React from "react";
import { useShellStore } from "@/lib/state/shell-store";

/**
 * Applies the `data-theme` attribute (light/dark) on <html> from the
 * shell store's persisted user preference. Respects `prefers-color-scheme`
 * on first paint (no flash) by computing from matchMedia when unset.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useShellStore((s) => s.theme);

  React.useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const resolve = () => {
      const effective = theme === "system" ? (media.matches ? "dark" : "light") : theme;
      root.dataset.theme = effective;
      root.style.colorScheme = effective;
    };
    resolve();
    if (theme === "system") media.addEventListener("change", resolve);
    return () => media.removeEventListener("change", resolve);
  }, [theme]);

  return <>{children}</>;
}