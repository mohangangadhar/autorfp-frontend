"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEM, NAV_ITEMS } from "@/lib/nav/registry";
import { useAuth } from "@/lib/auth/auth-context";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";
import { useShellStore } from "@/lib/state/shell-store";
import type { NavItem } from "@/lib/nav/registry";

export function Sidebar() {
  const { can } = useAuth();
  const pathname = usePathname();
  const collapsed = useShellStore((s) => s.sidebarCollapsed);

  const items = NAV_ITEMS.filter((item) => item.permission === null || can(item.permission));

  return (
    <aside
      aria-label={t("shell.sideNav")}
      className={cn(
        "fixed inset-y-0 left-0 z-sidebar hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex",
        "transition-[width] duration-150",
        collapsed && "md:w-14",
      )}
      data-testid="sidebar"
    >
      <div
        className={cn(
          "flex h-14 items-center border-b border-border px-4",
          collapsed && "md:justify-center md:px-0",
        )}
      >
        <Brand />
      </div>
      <ul className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => (
          <li key={item.key}>
            <NavLink item={item} pathname={pathname} collapsed={collapsed} />
          </li>
        ))}
        {can(ADMIN_NAV_ITEM.permission ?? "admin.read") && (
          <li className="mt-4 border-t border-border pt-3">
            <NavLink item={ADMIN_NAV_ITEM} pathname={pathname} collapsed={collapsed} />
          </li>
        )}
      </ul>
    </aside>
  );
}

export function NavLink({
  item,
  pathname,
  collapsed,
  onClick,
  mobile,
}: {
  item: NavItem;
  pathname: string;
  collapsed?: boolean;
  onClick?: () => void;
  mobile?: boolean;
}) {
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      title={collapsed ? t(item.labelKey) : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-secondary transition-colors hover:bg-subtle hover:text-primary",
        active && "bg-subtle font-medium text-primary",
        collapsed && "md:justify-center md:px-0",
        mobile && "px-3",
      )}
    >
      <item.icon aria-hidden className="size-5 shrink-0" />
      <span className={cn(collapsed && "md:hidden")}>{t(item.labelKey)}</span>
    </Link>
  );
}

function Brand() {
  return (
    <span className="flex items-center gap-2">
      <span className="flex size-7 items-center justify-center rounded-md bg-brand-500 text-xs font-bold text-on-brand">
        A
      </span>
      <span className="text-sm font-semibold tracking-wide text-primary">{t("app.name")}</span>
    </span>
  );
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href || pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}