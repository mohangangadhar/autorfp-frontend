"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav/registry";
import { t } from "@/lib/i18n";

/** Breadcrumbs derived from the routing map (routing-design §1). */
export function Breadcrumbs() {
  const pathname = usePathname();
  const crumbs = resolveCrumbs(pathname);
  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <Fragment key={crumb.href}>
              <li className="flex items-center gap-1">
                {index > 0 && <ChevronRight aria-hidden className="size-3.5 text-muted" />}
                {last ? (
                  <span aria-current="page" className="font-medium text-primary">
                    {crumb.label}
                  </span>
                ) : (
                  <Link href={crumb.href} className="text-muted hover:text-primary">
                    {crumb.label}
                  </Link>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

function resolveCrumbs(pathname: string): Array<{ href: string; label: string }> {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Array<{ href: string; label: string }> = [];

  for (const item of NAV_ITEMS) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      crumbs.push({ href: item.href, label: t(item.labelKey) });
      break;
    }
  }

  const start = crumbs.length;
  for (let i = start; i < segments.length; i++) {
    const segment = segments[i];
    if (!segment) continue;
    crumbs.push({
      href: `/${segments.slice(0, i + 1).join("/")}`,
      label: humanize(segment),
    });
  }
  return crumbs;
}

function humanize(segment: string): string {
  const words = segment.split("-");
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}