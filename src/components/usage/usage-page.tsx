"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/auth/auth-context";
import { PermissionDenied } from "@/components/auth/permission-denied";
import { ErrorState } from "@/components/shared/error-state";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportButton } from "@/components/audit/export-button";
import { usageRangeToDates, bucketByDay, summarizeStats, type UsageTimeRange } from "@/lib/usage/contract";
import { useUsageStats, useUsageTrend } from "@/lib/queries/usage";
import { t } from "@/lib/i18n";
import { TimeRangePicker } from "./time-range-picker";
import { UsageStatCards } from "./usage-stat-cards";

/**
 * `/admin/usage` — usage analytics dashboard (FE-ISSUE-US-001-04-02,
 * FE-AD-03). Gated on `admin.audit`; KPIs from `/audit/stats` and the
 * time-series from a date-windowed `/audit` list (usage-metering endpoints
 * are pending, so this screen degrades to audit data per FE-AD-03 §9).
 * Heavy chart is lazy-loaded via `next/dynamic`.
 */
const UsageChart = dynamic(
  () => import("./usage-chart").then((module) => module.UsageChart),
  { loading: () => <UsageChartSkeleton /> },
);

export function UsagePage() {
  const { can } = useAuth();
  const [range, setRange] = React.useState<UsageTimeRange>("30d");

  const stats = useUsageStats();
  const trend = useUsageTrend(range);
  const buckets = React.useMemo(() => bucketByDay(trend.data?.events ?? []), [trend.data]);

  if (!can("admin.audit")) {
    return <PermissionDenied />;
  }

  return (
    <div className="space-y-4" data-testid="usage-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-primary">{t("usage.title")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">{t("usage.description")}</p>
        </div>
        <div className="flex items-center gap-3">
          <TimeRangePicker value={range} onChange={setRange} />
          <ExportButton
            filters={{ date_from: usageRangeToDates(range).dateFrom, date_to: usageRangeToDates(range).dateTo }}
          />
        </div>
      </div>

      {stats.isPending ? <StatCardsSkeleton /> : null}
      {stats.isError ? (
        <ErrorState
          error={stats.error}
          title={t("usage.errorTitle")}
          onRetry={() => void Promise.all([stats.refetch(), trend.refetch()])}
        />
      ) : null}
      {stats.isSuccess ? <UsageStatCards summary={summarizeStats(stats.data)} /> : null}

      {trend.isError ? (
        <ErrorState
          error={trend.error}
          title={t("usage.errorTitle")}
          onRetry={() => void trend.refetch()}
        />
      ) : null}
      {trend.isSuccess ? (
        <UsageChart
          buckets={buckets}
          total={trend.data.total}
          truncated={trend.data.truncated}
        />
      ) : null}
    </div>
  );
}

function StatCardsSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      data-testid="usage-stat-cards-skeleton"
      aria-hidden
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="space-y-2 p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function UsageChartSkeleton() {
  return (
    <Card data-testid="usage-chart">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-52" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-52 w-full" />
      </CardContent>
    </Card>
  );
}
