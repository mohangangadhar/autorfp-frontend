"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";
import type { OrganizationFormValues } from "./schemas";

/**
 * Step 2 — tenant configuration defaults (branding, analysis thresholds,
 * workflow config). All fields carry sensible defaults so the step validates
 * clean without user input. These map into the backend `settings` JSONB.
 */
export function TenantPanel() {
  const {
    register,
    formState: { errors },
  } = useFormContext<OrganizationFormValues>();

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-primary">{t("org.branding")}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="branding-primary">{t("org.primaryColor")}</Label>
            <ColorInput id="branding-primary" field="settings.branding.primary_color" invalid={Boolean(errors.settings?.branding?.primary_color)} />
            {errors.settings?.branding?.primary_color ? <ErrorText message={errors.settings.branding.primary_color.message} /> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="branding-secondary">{t("org.secondaryColor")}</Label>
            <ColorInput id="branding-secondary" field="settings.branding.secondary_color" invalid={Boolean(errors.settings?.branding?.secondary_color)} />
            {errors.settings?.branding?.secondary_color ? <ErrorText message={errors.settings.branding.secondary_color.message} /> : null}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-primary">{t("org.analysisThresholds")}</h2>
        <div className="grid grid-cols-2 gap-4">
          <NumberInput id="threshold-coverage" label={t("org.coverageThreshold")} field="settings.thresholds.coverage_threshold" />
          <NumberInput id="threshold-confidence" label={t("org.confidenceThreshold")} field="settings.thresholds.confidence_threshold" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-primary">{t("org.workflowConfig")}</h2>
        <label className="flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            className="mt-1 size-4 rounded border-border accent-brand-500"
            {...register("settings.workflow.require_approval")}
          />
          <span className="text-sm text-primary">{t("org.requireApproval")}</span>
        </label>
      </section>
    </div>
  );
}

function ColorInput({ id, field, invalid }: { id: string; field: "settings.branding.primary_color" | "settings.branding.secondary_color"; invalid?: boolean }) {
  const { register } = useFormContext<OrganizationFormValues>();
  return (
    <div className="flex items-center gap-2">
      <Input
        id={id}
        type="color"
        className={cn("h-10 w-12 cursor-pointer p-1", invalid && "border-danger")}
        {...register(field)}
      />
      <Input type="text" className="w-full" {...register(field)} invalid={invalid} />
    </div>
  );
}

function NumberInput({ id, label, field }: { id: string; label: string; field: "settings.thresholds.coverage_threshold" | "settings.thresholds.confidence_threshold" }) {
  const {
    register,
    formState: { errors },
  } = useFormContext<OrganizationFormValues>();
  const error =
    field === "settings.thresholds.coverage_threshold"
      ? errors.settings?.thresholds?.coverage_threshold
      : errors.settings?.thresholds?.confidence_threshold;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="number" min={0} max={100} {...register(field)} invalid={Boolean(error)} />
      {error ? <ErrorText message={error.message} /> : null}
    </div>
  );
}

function ErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-danger-text">{message}</p>;
}
