"use client";

import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/lib/i18n";
import type { UsageSummary } from "@/lib/usage/contract";

/**
 * `/admin/usage` — KPI stat cards (FE-AD-03 AdminStatCards, ui/09 StatCard).
 * Metrics are derived from `/audit/stats` (usage-metering endpoints pending).
 */
export function UsageStatCards({ summary }: { summary: UsageSummary }) {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      data-testid="usage-stat-cards"
    >
      <StatCard label={t("usage.statTotalEvents")} value={summary.totalEvents} />
      <StatCard label={t("usage.statOrganizations")} value={summary.organizations} />
      <StatCard
        label={t("usage.statTopAction")}
        value={summary.topAction?.name}
        meta={
          summary.topAction
            ? t("usage.eventCount", { count: summary.topAction.count })
            : undefined
        }
      />
      <StatCard
        label={t("usage.statTopEntityType")}
        value={summary.topEntityType?.name}
        meta={
          summary.topEntityType
            ? t("usage.eventCount", { count: summary.topEntityType.count })
            : undefined
        }
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  meta,
}: {
  label: string;
  value: number | string | null | undefined;
  meta?: string;
}) {
  return (
    <Card data-testid="usage-stat-card">
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-1 truncate text-2xl font-semibold text-primary">
          {value === null || value === undefined ? "—" : typeof value === "number" ? value.toLocaleString() : value}
        </p>
        {meta ? <p className="mt-1 text-xs text-muted">{meta}</p> : null}
      </CardContent>
    </Card>
  );
}
