"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

/**
 * Server-side pagination control (ui/05-tables — footer pagination).
 * Renders a page indicator plus prev/next; the parent owns the page state
 * and refetches via the query hook.
 */
export function PaginationBar({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div
      className="flex items-center justify-between gap-4 border-t border-border px-5 py-3"
      data-testid="pagination-bar"
    >
      <p className="text-xs text-muted">
        {t("audit.pageOf", { page: String(page), total: String(totalPages) })}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
          aria-label={t("audit.pagePrev")}
          data-testid="pagination-prev"
        >
          <ChevronLeft aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          aria-label={t("audit.pageNext")}
          data-testid="pagination-next"
        >
          <ChevronRight aria-hidden />
        </Button>
      </div>
    </div>
  );
}
