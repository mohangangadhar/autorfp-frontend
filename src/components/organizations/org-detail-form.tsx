"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { t } from "@/lib/i18n";
import { REGION_OPTIONS, type OrganizationFormValues } from "./schemas";

/**
 * Step 1 — organization identity: name, slug (auto-suggested), domain, region, retention.
 */
export function OrgDetailForm() {
  const {
    register,
    formState: { errors },
  } = useFormContext<OrganizationFormValues>();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="org-name">
          {t("org.name")} <RequiredStar />
        </Label>
        <Input
          id="org-name"
          autoComplete="organization"
          {...register("name")}
          aria-describedby="org-name-hint"
          invalid={Boolean(errors.name)}
        />
        <p id="org-name-hint" className="text-xs text-muted">
          {t("org.nameHint")}
        </p>
        {errors.name ? <FieldError message={errors.name.message} /> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="org-slug">
          {t("org.slug")} <RequiredStar />
        </Label>
        <Input
          id="org-slug"
          {...register("slug")}
          aria-describedby="org-slug-hint"
          invalid={Boolean(errors.slug)}
        />
        <p id="org-slug-hint" className="text-xs text-muted">
          {t("org.slugHint")}
        </p>
        {errors.slug ? <FieldError message={errors.slug.message} /> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="org-domain">{t("org.domain")}</Label>
        <Input
          id="org-domain"
          type="text"
          autoComplete="off"
          {...register("domain")}
          aria-describedby="org-domain-hint"
          invalid={Boolean(errors.domain)}
        />
        <p id="org-domain-hint" className="text-xs text-muted">
          {t("org.domainHint")}
        </p>
        {errors.domain ? <FieldError message={errors.domain.message} /> : null}
      </div>

      <RegionSelect />
    </div>
  );
}

function RegionSelect() {
  const { setValue, watch } = useFormContext<OrganizationFormValues>();
  const region = watch("region");
  return (
    <div className="space-y-2">
      <Label>{t("org.region")}</Label>
      <Select value={region} onValueChange={(value) => setValue("region", value, { shouldValidate: true })}>
        <SelectTrigger aria-label={t("org.region")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {REGION_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {regionLabel(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function regionLabel(option: (typeof REGION_OPTIONS)[number]): string {
  switch (option) {
    case "us-east":
      return t("org.regionUsEast");
    case "us-west":
      return t("org.regionUsWest");
    case "eu-central":
      return t("org.regionEuCentral");
  }
}

function RequiredStar() {
  return (
    <span className="text-danger-text" aria-hidden>
      {" "}
      *
    </span>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-danger-text">{message}</p>;
}
