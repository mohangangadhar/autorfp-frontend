"use client";

import { useController, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label, RequiredIndicator } from "@/components/ui/label";
import { t } from "@/lib/i18n";
import { INVITE_ROLES, ROLE_LABELS } from "./roles";
import type { InviteRole } from "@/types/api";

interface RoleSelectProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
}

/**
 * Role assignment select for the invite form (US-001-02-01). Options are the
 * backend `InviteRequest` role enum — viewer/editor/org_admin.
 */
export function RoleSelect<T extends FieldValues>({ control, name }: RoleSelectProps<T>) {
  const { field, fieldState } = useController<T>({ control, name });

  return (
    <div className="space-y-2">
      <Label htmlFor="invite-role">
        {t("users.role")} <RequiredIndicator />
      </Label>
      <Select
        value={String(field.value)}
        onValueChange={(value) => field.onChange(value as InviteRole)}
        name={name}
      >
        <SelectTrigger id="invite-role" aria-invalid={fieldState.invalid ? true : undefined}>
          <SelectValue placeholder={t("users.rolePlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          {INVITE_ROLES.map((role) => (
            <SelectItem key={role} value={role}>
              {t(ROLE_LABELS[role])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {fieldState.error ? <p className="text-sm text-danger-text">{fieldState.error.message}</p> : null}
    </div>
  );
}
