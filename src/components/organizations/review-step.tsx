"use client";

import { useWatch } from "react-hook-form";
import { t } from "@/lib/i18n";
import type { OrganizationFormValues } from "./schemas";

/** Step 3 — read-only review of every captured value before submission. */
export function ReviewStep() {
  const values = useWatch<OrganizationFormValues>() as OrganizationFormValues;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t("org.reviewHint")}</p>

      <dl className="divide-y divide-border rounded-lg border border-border bg-surface">
        <Row label={t("org.name")} value={values.name} />
        <Row label={t("org.slug")} value={values.slug} />
        <Row
          label={t("org.analysisThresholds")}
          value={`${values.settings?.thresholds?.coverage_threshold}% / ${values.settings?.thresholds?.confidence_threshold}%`}
        />
        <Row
          label={t("org.requireApproval")}
          value={values.settings?.workflow?.require_approval ? "Yes" : "No"}
        />
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-primary">{value || "—"}</dd>
    </div>
  );
}
