"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TREND_MAX_PAGES, TREND_PAGE_SIZE } from "@/lib/queries/usage";
import { formatDayLabel, type DayBucket } from "@/lib/usage/contract";
import { t } from "@/lib/i18n";

/**
 * `/admin/usage` — day-bucket bar chart (FE-AD-03 UsageChart, ui/21-charts).
 *
 * Lightweight SVG (no chart dependency — keeps the bundle budgeted and is
 * lazy-loaded by the page). Every chart has a text alternative: a visible
 * summary sentence plus a "View as table" data table; `role="img"` carries
 * the accessible name. No fill-only encoding and no JS animation
 * (prefers-reduced-motion is honored by the global CSS).
 */
export function UsageChart({
  buckets,
  total,
  truncated,
}: {
  buckets: DayBucket[];
  total: number;
  truncated: boolean;
}) {
  const [showTable, setShowTable] = React.useState(false);

  const peak = buckets.reduce<DayBucket | null>(
    (best, bucket) => (best === null || bucket.count > best.count ? bucket : best),
    null,
  );
  const summary =
    buckets.length > 0 && peak
      ? t("usage.chartSummary", {
          total: String(total),
          days: String(buckets.length),
          peak: String(peak.count),
          date: formatDayLabel(peak.date),
        })
      : t("usage.chartEmpty");

  return (
    <Card data-testid="usage-chart">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{t("usage.chartTitle")}</CardTitle>
          <CardDescription>{t("usage.chartSubtitle")}</CardDescription>
        </div>
        {buckets.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-expanded={showTable}
            onClick={() => setShowTable((visible) => !visible)}
            data-testid="usage-chart-table-toggle"
          >
            {showTable ? t("usage.chartHideTable") : t("usage.chartViewTable")}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {buckets.length === 0 ? (
          <div
            className="flex items-center justify-center rounded-md border border-dashed border-border-strong px-6 py-10 text-sm text-muted"
            data-testid="usage-chart-empty"
          >
            {t("usage.chartEmpty")}
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-muted" data-testid="usage-chart-summary">
              {summary}
            </p>
            <div role="img" aria-label={summary} data-testid="usage-chart-svg">
              <BarChart buckets={buckets} />
            </div>
          </>
        )}
        {truncated ? (
          <p
            className="mt-3 text-xs text-muted"
            data-testid="usage-chart-truncated"
          >
            {t("usage.chartTruncated", { cap: String(TREND_MAX_PAGES * TREND_PAGE_SIZE) })}
          </p>
        ) : null}
        {showTable && buckets.length > 0 ? <DayTable buckets={buckets} /> : null}
      </CardContent>
    </Card>
  );
}

/** Bare SVG bars + sparse x-axis labels. */
function BarChart({ buckets }: { buckets: DayBucket[] }) {
  const WIDTH = 560;
  const HEIGHT = 180;
  const PAD_X = 10;
  const PAD_TOP = 10;
  const PAD_BOTTOM = 26;
  const maxCount = Math.max(1, ...buckets.map((bucket) => bucket.count));

  const plotWidth = WIDTH - PAD_X * 2;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const step = plotWidth / buckets.length;
  const barWidth = Math.max(1, step * 0.6);
  const labelEvery = Math.max(1, Math.ceil(buckets.length / 10));

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-auto w-full text-muted"
      role="presentation"
      aria-hidden
    >
      {buckets.map((bucket, index) => {
        const barHeight = (bucket.count / maxCount) * plotHeight;
        const x = PAD_X + index * step + (step - barWidth) / 2;
        const y = PAD_TOP + plotHeight - barHeight;
        return (
          <rect
            key={bucket.date}
            x={x}
            y={y}
            width={barWidth}
            height={Math.max(1, barHeight)}
            rx={1.5}
            className="fill-brand-500"
          >
            <title>{`${formatDayLabel(bucket.date)} — ${bucket.count}`}</title>
          </rect>
        );
      })}
      {buckets.map((bucket, index) => {
        if (index % labelEvery !== 0 && index !== buckets.length - 1) return null;
        const x = PAD_X + index * step + step / 2;
        return (
          <text
            key={`label-${bucket.date}`}
            x={x}
            y={HEIGHT - 8}
            textAnchor="middle"
            className="fill-muted text-[10px]"
          >
            {formatDayLabel(bucket.date)}
          </text>
        );
      })}
    </svg>
  );
}

/** Text alternative — the chart as a data table (source of truth). */
function DayTable({ buckets }: { buckets: DayBucket[] }) {
  return (
    <table
      className="mt-4 w-full text-sm"
      aria-label={t("usage.chartTitle")}
      data-testid="usage-chart-table"
    >
      <thead>
        <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
          <th scope="col" className="px-2 py-2 font-medium">
            {t("usage.chartColumnDay")}
          </th>
          <th scope="col" className="px-2 py-2 font-medium">
            {t("usage.chartColumnCount")}
          </th>
        </tr>
      </thead>
      <tbody>
        {buckets.map((bucket) => (
          <tr key={bucket.date} className="border-b border-border last:border-0">
            <td className="px-2 py-2 text-primary">{formatDayLabel(bucket.date)}</td>
            <td className="px-2 py-2 text-muted">{bucket.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
