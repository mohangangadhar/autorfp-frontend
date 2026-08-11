"use client";

import { useWatch } from "react-hook-form";
import { t } from "@/lib/i18n";
import type { OrganizationFormValues } from "./schemas";

/** Step 4 — read-only review of every captured value before submission. */
export function ReviewStep() {
  const values = useWatch<OrganizationFormValues>() as OrganizationFormValues;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t("org.reviewHint")}</p>

      <dl className="divide-y divide-border rounded-lg border border-border bg-surface">
        <Row label={t("org.name")} value={values.name} />
        <Row label={t("org.slug")} value={values.slug} />
        <Row label={t("org.domain")} value={values.domain || "—"} />
        <Row label={t("org.region")} value={regionLabel(values.region)} />
        <Row label={t("org.adminEmail")} value={values.admin?.email} />
        <Row label={t("org.dataRetention")} value={`${values.data_retention_days}`} />
        <Row
          label={t("org.analysisThresholds")}
          value={`${values.config?.thresholds?.coverage_threshold}% / ${values.config?.thresholds?.confidence_threshold}%`}
        />
        <Row
          label={t("org.requireApproval")}
          value={values.config?.workflow?.require_approval ? "Yes" : "No"}
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

function regionLabel(region?: string): string {
  switch (region) {
    case "us-east":
      return t("org.regionUsEast");
    case "us-west":
      return t("org.regionUsWest");
    case "eu-central":
      return t("org.regionEuCentral");
    default:
      return region ?? "—";
  }
}
