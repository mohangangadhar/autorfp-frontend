"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";
import type { AuditLogFilters } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from "@/lib/i18n";

/**
 * `/admin/audit` filter bar — server-side filters (FE-AD-01).
 *
 * Uncontrolled draft inputs; filters are applied (and the query re-run) only
 * on "Apply". The parent remounts the bar via `key` when the applied filters
 * change, so the draft always mirrors what is active (no effect sync).
 */
export function FilterBar({
  initial,
  onApply,
}: {
  initial: AuditLogFilters;
  onApply: (filters: AuditLogFilters) => void;
}) {
  const [action, setAction] = React.useState(initial.action ?? "");
  const [actor, setActor] = React.useState(initial.user_id ?? "");
  const [entityType, setEntityType] = React.useState(initial.entity_type ?? "");
  const [entityId, setEntityId] = React.useState(initial.entity_id ?? "");
  const [dateFrom, setDateFrom] = React.useState(initial.date_from ?? "");
  const [dateTo, setDateTo] = React.useState(initial.date_to ?? "");

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(toFilters({ action, actor, entityType, entityId, dateFrom, dateTo }));
  };

  const handleClear = () => {
    setAction("");
    setActor("");
    setEntityType("");
    setEntityId("");
    setDateFrom("");
    setDateTo("");
    onApply({});
  };

  return (
    <form
      onSubmit={handleApply}
      className="grid grid-cols-1 gap-4 rounded-md border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-6"
      data-testid="audit-filter-bar"
    >
      <div className="space-y-1.5">
        <Label htmlFor="audit-filter-action">{t("audit.filterAction")}</Label>
        <Input
          id="audit-filter-action"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder={t("audit.filterActionPlaceholder")}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="audit-filter-actor">{t("audit.filterActor")}</Label>
        <Input
          id="audit-filter-actor"
          value={actor}
          onChange={(e) => setActor(e.target.value)}
          placeholder={t("audit.filterActorPlaceholder")}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="audit-filter-resource-type">{t("audit.filterResource")}</Label>
        <Input
          id="audit-filter-resource-type"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          placeholder={t("audit.filterResourcePlaceholder")}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="audit-filter-resource-id">{t("audit.filterResourceId")}</Label>
        <Input
          id="audit-filter-resource-id"
          value={entityId}
          onChange={(e) => setEntityId(e.target.value)}
          placeholder={t("audit.filterResourceIdPlaceholder")}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="audit-filter-from">{t("audit.filterFrom")}</Label>
        <Input
          id="audit-filter-from"
          type="date"
          value={dateFrom}
          max={dateTo || undefined}
          onChange={(e) => setDateFrom(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="audit-filter-to">{t("audit.filterTo")}</Label>
        <Input
          id="audit-filter-to"
          type="date"
          value={dateTo}
          min={dateFrom || undefined}
          onChange={(e) => setDateTo(e.target.value)}
        />
      </div>
      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6">
        <Button type="submit" variant="primary" data-testid="audit-apply-filters">
          <SlidersHorizontal aria-hidden />
          {t("audit.applyFilters")}
        </Button>
        <Button type="button" variant="outline" onClick={handleClear} data-testid="audit-clear-filters">
          {t("audit.clearFilters")}
        </Button>
      </div>
    </form>
  );
}

/** Trim + drop empty fields so the query stays minimal. */
function toFilters(input: {
  action: string;
  actor: string;
  entityType: string;
  entityId: string;
  dateFrom: string;
  dateTo: string;
}): AuditLogFilters {
  const filters: AuditLogFilters = {};
  if (input.action.trim()) filters.action = input.action.trim();
  if (input.actor.trim()) filters.user_id = input.actor.trim();
  if (input.entityType.trim()) filters.entity_type = input.entityType.trim();
  if (input.entityId.trim()) filters.entity_id = input.entityId.trim();
  if (input.dateFrom) filters.date_from = input.dateFrom;
  if (input.dateTo) filters.date_to = input.dateTo;
  return filters;
}
