"use client";

import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { ADMIN_NAV_ITEM, NAV_ITEMS } from "@/lib/nav/registry";
import { NavLink } from "@/components/shell/sidebar";
import { useAuth } from "@/lib/auth/auth-context";
import { useShellStore } from "@/lib/state/shell-store";
import { t } from "@/lib/i18n";

export function MobileNav() {
  const open = useShellStore((s) => s.mobileNavOpen);
  const close = useShellStore((s) => s.closeMobileNav);
  const { can } = useAuth();
  const pathname = usePathname();

  if (!open) return null;

  const items = [...NAV_ITEMS.filter((item) => item.permission === null || can(item.permission)), ADMIN_NAV_ITEM];

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label={t("shell.sideNav")}>
      <button className="absolute inset-0 bg-overlay/50" aria-label={t("shell.closeMenu")} onClick={close} />
      <div className="relative flex h-full w-72 flex-col bg-surface shadow-overlay">
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <span className="text-sm font-semibold text-primary">{t("app.name")}</span>
          <button type="button" aria-label={t("shell.closeMenu")} onClick={close} className="rounded-md p-1.5 text-muted hover:bg-subtle">
            <X aria-hidden className="size-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => (
            <NavLink key={item.key} item={item} pathname={pathname} onClick={close} mobile />
          ))}
        </nav>
      </div>
    </div>
  );
}