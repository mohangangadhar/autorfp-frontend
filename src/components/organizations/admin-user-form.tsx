"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from "@/lib/i18n";
import type { OrganizationFormValues } from "./schemas";

/**
 * Step 2 — default admin user. The backend provisions this user and sends
 * the activation email (AC: "default admin user created + activation email").
 */
export function AdminUserForm() {
  const {
    register,
    formState: { errors },
  } = useFormContext<OrganizationFormValues>();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-primary">{t("org.adminUserTitle")}</h2>
        <p className="mt-1 text-sm text-muted">{t("org.adminUserHint")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="admin-name">
          {t("org.adminName")} <Star />
        </Label>
        <Input id="admin-name" autoComplete="name" {...register("admin.name")} invalid={Boolean(errors.admin?.name)} />
        {errors.admin?.name ? <ErrorText message={errors.admin.name.message} /> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="admin-email">
          {t("org.adminEmail")} <Star />
        </Label>
        <Input id="admin-email" type="email" autoComplete="email" {...register("admin.email")} invalid={Boolean(errors.admin?.email)} />
        {errors.admin?.email ? <ErrorText message={errors.admin.email.message} /> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="admin-password">
          {t("org.adminPassword")} <Star />
        </Label>
        <Input
          id="admin-password"
          type="password"
          autoComplete="new-password"
          {...register("admin.password")}
          aria-describedby="admin-password-hint"
          invalid={Boolean(errors.admin?.password)}
        />
        <p id="admin-password-hint" className="text-xs text-muted">
          {t("org.adminPasswordHint")}
        </p>
        {errors.admin?.password ? <ErrorText message={errors.admin.password.message} /> : null}
      </div>
    </div>
  );
}

function Star() {
  return (
    <span className="text-danger-text" aria-hidden>
      {" "}
      *
    </span>
  );
}

function ErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-danger-text">{message}</p>;
}
