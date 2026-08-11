"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useOrganizations } from "@/lib/queries/organizations";
import { useAuth } from "@/lib/auth/auth-context";
import { PermissionDenied } from "@/components/auth/permission-denied";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageSkeleton } from "@/components/shared/loaders";
import { t } from "@/lib/i18n";
import { StatusChip } from "./status-chip";
import { OrgStatusToggle } from "./org-status-toggle";
import type { OrganizationDto } from "@/types/api";

/**
 * `/admin/organizations` — tenant organization list (TASK-US-001-01-01-FE-2).
 * LEES: loading skeleton / empty CTA / error+retry / table with status chips.
 */
export function OrganizationsList() {
  const { can } = useAuth();
  const list = useOrganizations({ page: 1, perPage: 50 });

  if (!can("admin.read")) {
    return <PermissionDenied />;
  }

  return (
    <div className="space-y-4" data-testid="organizations-page">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-primary">{t("org.listTitle")}</h1>
          <p className="mt-1 text-sm text-muted">{t("org.listDescription")}</p>
        </div>
        {can("admin.write") ? (
          <Button asChild>
            <Link href="/admin/organizations/new">
              <Plus aria-hidden className="size-4" />
              {t("org.newOrganization")}
            </Link>
          </Button>
        ) : null}
      </div>

      {list.isPending ? <PageSkeleton lines={5} /> : null}
      {list.isError ? <ErrorState error={list.error} onRetry={() => void list.refetch()} /> : null}
      {list.isSuccess && list.data.items.length === 0 ? (
        <EmptyState
          title={t("org.emptyTitle")}
          description={t("org.emptyHint")}
          action={
            can("admin.write") ? (
              <Button asChild>
                <Link href="/admin/organizations/new">{t("org.newOrganization")}</Link>
              </Button>
            ) : undefined
          }
        />
      ) : null}
      {list.isSuccess && list.data.items.length > 0 ? <OrganizationsTable organizations={list.data.items} /> : null}
    </div>
  );
}

function OrganizationsTable({ organizations }: { organizations: OrganizationDto[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("org.listTitle")}</CardTitle>
        <CardDescription>
          {organizations.length} {organizations.length === 1 ? "organization" : "organizations"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label={t("org.listTitle")}>
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th scope="col" className="px-5 py-3 font-medium">
                  {t("org.name")}
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  {t("org.slug")}
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  {t("org.domain")}
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Status
                </th>
                <th scope="col" className="px-5 py-3 text-right font-medium">
                  Created
                </th>
                <th scope="col" className="px-5 py-3 text-right font-medium">
                  {t("org.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org) => (
                <tr key={org.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium text-primary">{org.name}</td>
                  <td className="px-5 py-3 text-muted">/{org.slug}</td>
                  <td className="px-5 py-3 text-muted">{org.domain ?? "—"}</td>
                  <td className="px-5 py-3">
                    <StatusChip status={org.status} />
                  </td>
                  <td className="px-5 py-3 text-right text-muted">{formatDate(org.created_at)}</td>
                  <td className="px-5 py-3 text-right">
                    <OrgStatusToggle org={org} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}