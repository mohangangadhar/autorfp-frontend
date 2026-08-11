"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldPath } from "react-hook-form";
import { useAuth } from "@/lib/auth/auth-context";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { useCreateOrganization } from "@/lib/queries/organizations";
import type { OrganizationDto } from "@/types/api";
import {
  organizationDefaults,
  organizationSchema,
  toCreateRequest,
  type OrganizationFormValues,
} from "./schemas";
import { suggestSlug } from "./slug";
import { applyServerErrors, toAppError } from "./server-errors";
import { OrgDetailForm } from "./org-detail-form";
import { AdminUserForm } from "./admin-user-form";
import { TenantPanel } from "./tenant-panel";
import { ReviewStep } from "./review-step";
import { ConfirmDialog } from "./confirm-dialog";

const STEPS = [
  { id: "organization", labelKey: "org.stepOrganization" },
  { id: "admin", labelKey: "org.stepAdmin" },
  { id: "configuration", labelKey: "org.stepConfiguration" },
  { id: "review", labelKey: "org.stepReview" },
] as const;

const STEP_FIELDS: ReadonlyArray<readonly FieldPath<OrganizationFormValues>[]> = [
  ["name", "slug", "domain", "region"],
  ["admin.name", "admin.email", "admin.password"],
  [],
  [],
];

/**
 * US-001-01-01 — multi-step Organization Create wizard (issue target state):
 * name/domain → admin user → configuration → review. Self-service mode is
 * public; admin mode submits with the session Bearer and invalidates the list.
 */
export function OrganizationCreateWizard({
  mode = "self-service",
}: {
  mode?: "self-service" | "admin";
}) {
  const router = useRouter();
  const { can } = useAuth();
  const [step, setStep] = React.useState(0);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [createdOrg, setCreatedOrg] = React.useState<OrganizationDto | null>(null);

  const isSelfService = mode === "self-service";
  const create = useCreateOrganization({ public: isSelfService });

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: organizationDefaults,
    mode: "onTouched",
  });

  const name = useWatch({ control: form.control, name: "name" });
  const slug = useWatch({ control: form.control, name: "slug" });
  const suggested = suggestSlug(name);

  // Auto-suggest the slug from the name, but stop the moment the slug no
  // longer matches what we last suggested (i.e. the user edited it).
  const lastSuggested = React.useRef("");
  React.useEffect(() => {
    if (name === "" || slug !== lastSuggested.current) return;
    lastSuggested.current = suggested;
    form.setValue("slug", suggested, { shouldValidate: false, shouldDirty: false });
  }, [name, slug, suggested, form]);

  const goNext = async () => {
    const fields = STEP_FIELDS[step] ?? [];
    const valid = fields.length === 0 ? true : await form.trigger(fields);
    if (valid) setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const handleConfirm = async () => {
    setServerError(null);
    const valid = await form.trigger();
    if (!valid) {
      setStep(0);
      return;
    }

    try {
      const org = await create.mutateAsync(toCreateRequest(form.getValues()));
      if (isSelfService) {
        setCreatedOrg(org);
      } else {
        router.push("/admin/organizations");
      }
    } catch (error) {
      const appError = toAppError(error);
      if (appError.code === "CONFLICT") {
        form.setError("name", {
          type: "server",
          message: t("org.duplicateName"),
        });
        form.setError("slug", { type: "server", message: t("org.duplicateSlug") });
        setStep(0);
        return;
      }
      if (applyServerErrors(form, error)) {
        setStep(0);
        return;
      }
      setServerError(appError.userMessage || t("common.somethingWentWrong"));
    }
  };

  if (createdOrg) {
    return <CreateSuccess adminEmail={form.getValues("admin.email")} />;
  }

  if (!isSelfService && !can("admin.write")) {
    return (
      <div role="status" className="rounded-md border border-border bg-surface p-4 text-sm text-muted">
        You do not have permission to create organizations.
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <div className="space-y-5">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-primary">{t("org.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("org.subtitle")}</p>
        </header>

        <Stepper current={step} />

        {step === 0 ? <OrgDetailForm /> : null}
        {step === 1 ? <AdminUserForm /> : null}
        {step === 2 ? <TenantPanel /> : null}
        {step === 3 ? <ReviewStep /> : null}

        {serverError ? (
          <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text" data-testid="wizard-server-error">
            {serverError}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="ghost" onClick={() => setStep((s) => Math.max(s - 1, 0))} disabled={step === 0}>
            {t("org.back")}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={() => void goNext()}>
              {t("org.continue")}
            </Button>
          ) : (
            <Button type="button" onClick={() => setConfirmOpen(true)} disabled={create.isPending} isLoading={create.isPending}>
              {t("org.createOrganization")}
            </Button>
          )}
        </div>

        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={t("org.confirmTitle")}
          description={t("org.confirmDescription")}
          confirmLabel={t("org.confirmLabel")}
          busy={create.isPending}
          onConfirm={() => void handleConfirm()}
        />
      </div>
    </FormProvider>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-1" aria-label="Progress">
      {STEPS.map((step, index) => (
        <li key={step.id} className="flex flex-1 items-center gap-1" aria-current={index === current ? "step" : undefined}>
          <span
            aria-hidden
            className={cn(
              "flex h-6 w-full items-center gap-2 text-xs font-medium",
              index <= current ? "text-brand-600" : "text-muted",
            )}
          >
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs",
                index < current
                  ? "border-brand-500 bg-brand-500 text-on-brand"
                  : index === current
                    ? "border-brand-500 text-brand-600"
                    : "border-border text-muted",
              )}
            >
              {index + 1}
            </span>
            <span className="truncate">{t(step.labelKey)}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function CreateSuccess({ adminEmail }: { adminEmail: string }) {
  return (
    <div className="space-y-4" data-testid="org-create-success">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-primary">{t("org.createdTitle")}</h1>
        <p className="mt-1 text-sm text-muted">{t("org.createdHint", { email: adminEmail ?? "" })}</p>
      </div>
      <Button asChild className="w-full">
        <Link href="/login">{t("org.signIn")}</Link>
      </Button>
    </div>
  );
}