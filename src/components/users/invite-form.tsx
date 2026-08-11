"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send } from "lucide-react";
import { useInviteUser } from "@/lib/queries/users";
import { toAppError } from "@/lib/api/error";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, RequiredIndicator } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleSelect } from "./role-select";
import type { InviteRole } from "@/types/api";

/**
 * Zod mirror of backend `InviteRequest` (email ≤255, name ≤255, role enum).
 * The email format check is frontend-only UX (forms-design §2); the backend
 * stays authoritative for uniqueness (USR-001 → 409).
 */
const inviteSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Enter the invitee's name." })
    .max(255, { message: "Name must be 255 characters or fewer." }),
  email: z
    .string()
    .trim()
    .min(1, { message: "Enter an email address." })
    .email({ message: "Enter a valid email address." })
    .max(255, { message: "Email must be 255 characters or fewer." }),
  role: z.enum(["viewer", "editor", "org_admin"]),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

const DEFAULTS: InviteFormValues = { name: "", email: "", role: "viewer" };

/**
 * US-001-02-01 — invite a team member by email with a role assignment.
 * LEES: busy submit, inline field errors (409 duplicate), success message,
 * then the list refreshes via `["users"]` invalidation.
 */
export function InviteForm() {
  const invite = useInviteUser();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [invitedEmail, setInvitedEmail] = React.useState<string | null>(null);

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: DEFAULTS,
    mode: "onTouched",
  });

  const handleSubmit = async (values: InviteFormValues) => {
    setServerError(null);
    setInvitedEmail(null);
    const email = values.email.trim().toLowerCase();
    try {
      await invite.mutateAsync({
        email,
        name: values.name.trim(),
        role: values.role as InviteRole,
      });
      setInvitedEmail(email);
      form.reset(DEFAULTS);
    } catch (error) {
      const appError = toAppError(error);
      if (appError.code === "CONFLICT") {
        form.setError("email", { type: "server", message: t("users.duplicateEmail") });
        return;
      }
      setServerError(appError.userMessage || t("common.somethingWentWrong"));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("users.inviteTitle")}</CardTitle>
        <CardDescription>{t("users.inviteDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} noValidate>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="invite-name">
                {t("users.name")} <RequiredIndicator />
              </Label>
              <Input
                id="invite-name"
                autoComplete="name"
                {...form.register("name")}
                invalid={Boolean(form.formState.errors.name)}
              />
              {form.formState.errors.name ? (
                <p className="text-sm text-danger-text" data-testid="invite-name-error">
                  {form.formState.errors.name.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-email">
                {t("users.email")} <RequiredIndicator />
              </Label>
              <Input
                id="invite-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                {...form.register("email")}
                invalid={Boolean(form.formState.errors.email)}
              />
              {form.formState.errors.email ? (
                <p className="text-sm text-danger-text" data-testid="invite-email-error">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>

            <RoleSelect control={form.control} name="role" />

            {serverError ? (
              <p
                role="alert"
                data-testid="invite-server-error"
                className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text"
              >
                {serverError}
              </p>
            ) : null}

            {invitedEmail ? (
              <p
                role="status"
                data-testid="invite-success"
                className="rounded-md bg-success-bg px-3 py-2 text-sm text-success-text"
              >
                {t("users.inviteSuccess", { email: invitedEmail })}
              </p>
            ) : null}

            <div className="flex justify-end">
              <Button type="submit" isLoading={invite.isPending}>
                <Send aria-hidden className="size-4" />
                {t("users.inviteSubmit")}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
