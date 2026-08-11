"use client";

import * as React from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { PermissionDenied } from "@/components/auth/permission-denied";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageSkeleton } from "@/components/shared/loaders";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AUDIT_PAGE_SIZE_DEFAULT } from "@/lib/audit/contract";
import { useAuditLog, useAuditStats } from "@/lib/queries/audit";
import { t } from "@/lib/i18n";
import type { AuditLogDto, AuditLogFilters } from "@/types/api";
import { AuditTable } from "./audit-table";
import { FilterBar } from "./filter-bar";
import { EventDrawer } from "./event-drawer";
import { ExportButton } from "./export-button";

/**
 * `/admin/audit` — immutable audit trail (FE-ISSUE-US-001-04-01).
 *
 * LEES page: gate (admin.audit) → stats → filters → skeleton / error /
 * empty / table, with server-side pagination + created_at sort and a
 * right-side event drawer. Read-only surface backed by
 * `GET /api/v1/audit`, `/audit/stats`, `/audit/export`.
 */
export function AuditPage() {
  const { can } = useAuth();
  const [filters, setFilters] = React.useState<AuditLogFilters>({});
  const [page, setPage] = React.useState(1);
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [selected, setSelected] = React.useState<AuditLogDto | null>(null);

  const list = useAuditLog({
    ...filters,
    page,
    perPage: AUDIT_PAGE_SIZE_DEFAULT,
    sort_by: "created_at",
    sort_order: sortOrder,
  });
  const stats = useAuditStats();

  if (!can("admin.audit")) {
    return <PermissionDenied />;
  }

  const applyFilters = (next: AuditLogFilters) => {
    setFilters(next);
    setPage(1);
  };

  return (
    <div className="space-y-4" data-testid="audit-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-primary">{t("audit.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("audit.description")}</p>
        </div>
        <ExportButton filters={{ ...filters, sort_by: "created_at", sort_order: sortOrder }} />
      </div>

      {stats.isSuccess ? (
        <AuditStats
          totalEntries={stats.data.total_entries}
          totalOrganizations={stats.data.total_organizations}
        />
      ) : null}

      <FilterBar
        key={JSON.stringify(filters)}
        initial={filters}
        onApply={applyFilters}
      />

      {list.isPending ? <PageSkeleton lines={6} /> : null}
      {list.isError ? <ErrorState error={list.error} onRetry={() => void list.refetch()} /> : null}
      {list.isSuccess && list.data.items.length === 0 ? (
        <EmptyState
          title={t("audit.emptyTitle")}
          description={t("audit.emptyHint")}
          action={
            Object.keys(filters).length > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => applyFilters({})}
                data-testid="audit-empty-clear"
              >
                {t("audit.clearFilters")}
              </Button>
            ) : undefined
          }
        />
      ) : null}
      {list.isSuccess && list.data.items.length > 0 ? (
        <AuditTable
          events={list.data.items}
          total={list.data.total}
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
          page={list.data.page}
          totalPages={list.data.totalPages}
          onPageChange={setPage}
          onSelect={setSelected}
        />
      ) : null}

      <EventDrawer
        event={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}

function AuditStats({
  totalEntries,
  totalOrganizations,
}: {
  totalEntries: number;
  totalOrganizations: number;
}) {
  return (
    <Card data-testid="audit-stats">
      <CardContent className="grid grid-cols-2 gap-4 p-4 sm:max-w-md">
        <StatValue label={t("audit.statTotal")} value={totalEntries} />
        <StatValue label={t("audit.statOrganizations")} value={totalOrganizations} />
      </CardContent>
    </Card>
  );
}

function StatValue({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-primary" data-testid="audit-stat-value">
        {value.toLocaleString()}
      </p>
    </div>
  );
}
