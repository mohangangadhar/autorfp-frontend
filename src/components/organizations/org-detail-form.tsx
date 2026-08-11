"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from "@/lib/i18n";
import type { OrganizationFormValues } from "./schemas";

/**
 * Step 1 — organization identity: name + slug (auto-suggested).
 * Backend `OrganizationCreate` accepts only name/slug/settings.
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
    </div>
  );
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
