"use client";

import { Menu } from "lucide-react";
import { useShellStore } from "@/lib/state/shell-store";
import { t } from "@/lib/i18n";
import { UserMenu } from "@/components/shell/user-menu";

export function Topbar() {
  const toggleSidebar = useShellStore((s) => s.toggleSidebar);
  const toggleMobileNav = useShellStore((s) => s.toggleMobileNav);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-surface px-4">
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        className="hidden rounded-md p-2 text-muted hover:bg-subtle md:inline-flex"
      >
        <Menu aria-hidden className="size-5" />
      </button>
      <button
        type="button"
        onClick={toggleMobileNav}
        aria-label={t("shell.openMenu")}
        className="rounded-md p-2 text-muted hover:bg-subtle md:hidden"
      >
        <Menu aria-hidden className="size-5" />
      </button>

      <div className="ml-auto">
        <UserMenu />
      </div>
    </header>
  );
}