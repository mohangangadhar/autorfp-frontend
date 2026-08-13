"use client";

import { isUsageTimeRange, USAGE_TIME_RANGES, type UsageTimeRange } from "@/lib/usage/contract";
import { cn } from "@/lib/utils/cn";
import { t } from "@/lib/i18n";

/**
 * `/admin/usage` — time-range segmented control (7 / 30 / 90 days).
 * The active range drives `date_from`/`date_to` on the `/audit` window.
 */
export function TimeRangePicker({
  value,
  onChange,
}: {
  value: UsageTimeRange;
  onChange: (range: UsageTimeRange) => void;
}) {
  return (
    <div
      role="group"
      aria-label={t("usage.rangeLabel")}
      className="inline-flex items-center gap-1 rounded-md border border-border bg-subtle p-1"
      data-testid="time-range-picker"
    >
      {USAGE_TIME_RANGES.map((range) => (
        <button
          key={range}
          type="button"
          aria-pressed={range === value}
          onClick={() => onChange(range)}
          className={cn(
            "rounded px-3 py-1 text-sm text-secondary transition-colors hover:text-primary",
            range === value && "bg-surface text-primary shadow-sm",
          )}
          data-testid={`time-range-${range}`}
        >
          {rangeLabel(range)}
        </button>
      ))}
    </div>
  );
}

function rangeLabel(range: UsageTimeRange): string {
  if (!isUsageTimeRange(range)) return range;
  switch (range) {
    case "7d":
      return t("usage.range7d");
    case "30d":
      return t("usage.range30d");
    case "90d":
      return t("usage.range90d");
  }
}
