"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateRole, useUpdateRole } from "@/lib/queries/roles";
import { toAppError } from "@/lib/api/error";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label, RequiredIndicator } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PermissionMatrix } from "./permission-matrix";
import type { RoleDto } from "@/types/api";

const roleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Enter a role name." })
    .max(100, { message: "Role name must be 100 characters or fewer." }),
  description: z
    .string()
    .trim()
    .max(500, { message: "Description must be 500 characters or fewer." })
    .optional(),
});

type RoleFormValues = z.infer<typeof roleSchema>;

/**
 * RoleEditor — create/edit a custom role (US-001-02-03). Name, description
 * and the grouped PermissionMatrix. Zod mirrors `RoleCreateRequest`/`RoleUpdateRequest`
 * (backend stays authoritative for duplicates → 409 and predefined-role 400).
 * LEES: busy submit, inline errors, success closes and the list invalidates.
 */
export function RoleEditor({
  open,
  onOpenChange,
  role,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: RoleDto | null;
}) {
  const create = useCreateRole();
  const update = useUpdateRole();
  const pending = role ? update.isPending : create.isPending;

  return (
    <Dialog open={open} onOpenChange={(next) => (pending ? undefined : onOpenChange(next))}>
      <DialogContent className="max-w-2xl">
        <RoleEditorBody
          key={role?.id ?? "new"}
          role={role ?? null}
          onOpenChange={onOpenChange}
          create={create}
          update={update}
        />
      </DialogContent>
    </Dialog>
  );
}

/**
 * Inner form body, keyed by role id so switching roles (or closing and
 * reopening) resets name/description/bitmap/serverError without effects.
 */
function RoleEditorBody({
  role,
  onOpenChange,
  create,
  update,
}: {
  role: RoleDto | null;
  onOpenChange: (open: boolean) => void;
  create: ReturnType<typeof useCreateRole>;
  update: ReturnType<typeof useUpdateRole>;
}) {
  const isEdit = Boolean(role);
  const [bitmap, setBitmap] = React.useState(role?.permission_bitmap ?? 0);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const pending = isEdit ? update.isPending : create.isPending;

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: role?.name ?? "",
      description: role?.description ?? "",
    },
    mode: "onTouched",
  });

  const handleSubmit = async (values: RoleFormValues) => {
    setServerError(null);
    try {
      if (isEdit && role) {
        await update.mutateAsync({
          id: role.id,
          payload: {
            name: values.name.trim(),
            description: values.description?.trim() || null,
            permission_bitmap: bitmap,
          },
        });
      } else {
        await create.mutateAsync({
          name: values.name.trim(),
          description: values.description?.trim() || null,
          permission_bitmap: bitmap,
        });
      }
      onOpenChange(false);
    } catch (error) {
      const appError = toAppError(error);
      if (appError.code === "CONFLICT") {
        form.setError("name", { type: "server", message: t("roles.duplicateName") });
        return;
      }
      setServerError(appError.userMessage || t("common.somethingWentWrong"));
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} noValidate>
      <DialogHeader>
        <DialogTitle>
          {isEdit ? t("roles.editTitle", { name: role?.name ?? "" }) : t("roles.createTitle")}
        </DialogTitle>
        <DialogDescription>
          {isEdit ? t("roles.editDescription") : t("roles.createDescription")}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="role-name">
            {t("roles.name")} <RequiredIndicator />
          </Label>
          <Input
            id="role-name"
            {...form.register("name")}
            invalid={Boolean(form.formState.errors.name)}
          />
          {form.formState.errors.name ? (
            <p className="text-sm text-danger-text" data-testid="role-name-error">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="role-description">{t("roles.descriptionLabel")}</Label>
          <Textarea
            id="role-description"
            {...form.register("description")}
            invalid={Boolean(form.formState.errors.description)}
          />
          {form.formState.errors.description ? (
            <p className="text-sm text-danger-text" data-testid="role-description-error">
              {form.formState.errors.description.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium text-primary">{t("roles.permissions")}</span>
          <PermissionMatrix bitmap={bitmap} onChange={setBitmap} />
        </div>

        {serverError ? (
          <p
            role="alert"
            data-testid="role-server-error"
            className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text"
          >
            {serverError}
          </p>
        ) : null}
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" isLoading={pending}>
          {isEdit ? t("roles.save") : t("roles.create")}
        </Button>
      </DialogFooter>
    </form>
  );
}
