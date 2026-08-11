"use client";

import { ArrowDown, ArrowUp, ChevronRight } from "lucide-react";
import type { AuditLogDto } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { formatActor, formatChangeValue, formatEventTime } from "@/lib/audit/contract";
import { t } from "@/lib/i18n";

/**
 * `/admin/audit` — dense immutable event table (FE-AD-01 / SC-AD-03).
 * Server-side pagination and created_at sorting; row click opens the
 * EventDetailsDrawer. Read-only — no inline actions.
 */
export function AuditTable({
  events,
  total,
  sortOrder,
  onSortChange,
  page,
  totalPages,
  onPageChange,
  onSelect,
}: {
  events: AuditLogDto[];
  total: number;
  sortOrder: "asc" | "desc";
  onSortChange: (next: "asc" | "desc") => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSelect: (event: AuditLogDto) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("audit.listTitle")}</CardTitle>
        <CardDescription>
          {t("audit.eventCount", { count: String(total) })}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label={t("audit.listTitle")}>
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th
                  scope="col"
                  className="px-5 py-3 font-medium"
                  aria-sort={sortOrder === "desc" ? "descending" : "ascending"}
                >
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 uppercase tracking-wide text-muted hover:text-primary"
                    onClick={() => onSortChange(sortOrder === "desc" ? "asc" : "desc")}
                    aria-label={
                      sortOrder === "desc" ? t("audit.sortTimeAsc") : t("audit.sortTimeDesc")
                    }
                  >
                    {t("audit.columnTime")}
                    {sortOrder === "desc" ? (
                      <ArrowDown aria-hidden className="size-3" />
                    ) : (
                      <ArrowUp aria-hidden className="size-3" />
                    )}
                  </button>
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  {t("audit.columnActor")}
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  {t("audit.columnAction")}
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  {t("audit.columnResource")}
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  {t("audit.columnChanges")}
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  {t("audit.columnIp")}
                </th>
                <th scope="col" className="px-5 py-3 text-right font-medium">
                  <span className="sr-only">{t("audit.eventDrawerTitle")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr
                  key={event.id}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-subtle"
                  onClick={() => onSelect(event)}
                  data-testid="audit-row"
                >
                  <td className="whitespace-nowrap px-5 py-3 text-muted">
                    {formatEventTime(event.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-primary">
                    {formatActor(event.user_id)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-primary">
                    {event.action}
                  </td>
                  <td className="max-w-[16rem] truncate px-5 py-3 font-mono text-xs text-muted">
                    {event.entity_type}
                    {event.entity_id ? `:${event.entity_id}` : ""}
                  </td>
                  <td className="max-w-[14rem] truncate px-5 py-3 text-muted">
                    {summarizeChanges(event.changes)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-muted">
                    {event.ip_address ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t("audit.eventDrawerTitle")}
                      data-testid="audit-row-details"
                      onClick={(eventClick) => {
                        eventClick.stopPropagation();
                        onSelect(event);
                      }}
                    >
                      <ChevronRight aria-hidden />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationBar page={page} totalPages={totalPages} onPageChange={onPageChange} />
      </CardContent>
    </Card>
  );
}

/** Compact inline summary — the first change entry, or "—". */
function summarizeChanges(changes: Record<string, unknown> | null): string {
  if (!changes) return "—";
  const [firstKey, firstValue] = Object.entries(changes)[0] ?? [];
  if (firstKey === undefined) return "—";
  const rendered = formatChangeValue(firstValue);
  return `${firstKey}: ${rendered || "—"}`;
}
