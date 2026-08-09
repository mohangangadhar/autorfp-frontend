"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Shell UI state (state-management-design §3) — client-only, ephemeral.
 * Holds no server data. The theme preference persists so the first paint
 * respects the user's prior choice (TDD-019 `theme`).
 */

export type Theme = "light" | "dark" | "system";

interface ShellState {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  commandPaletteOpen: boolean;
  theme: Theme;
  toggleSidebar: () => void;
  toggleMobileNav: () => void;
  closeMobileNav: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  setTheme: (theme: Theme) => void;
}

export const useShellStore = create<ShellState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileNavOpen: false,
      commandPaletteOpen: false,
      theme: "system",
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleMobileNav: () => set((s) => ({ mobileNavOpen: !s.mobileNavOpen })),
      closeMobileNav: () => set({ mobileNavOpen: false }),
      openCommandPalette: () => set({ commandPaletteOpen: true }),
      closeCommandPalette: () => set({ commandPaletteOpen: false }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "autorfp-shell",
      partialize: (s) => ({ theme: s.theme }) as ShellState,
    },
  ),
);