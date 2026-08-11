"use client";

import * as React from "react";
import { useController, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateIdp, useUpdateIdp } from "@/lib/queries/idp";
import { toAppError } from "@/lib/api/error";
import {
  IDP_PROTOCOLS,
  LOCAL_ATTRIBUTE_FIELDS,
  isSaml,
  normalizeAttributeMapping,
  validateCertificate,
  type LocalAttributeField,
} from "@/lib/idp/contract";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, RequiredIndicator } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AttributeMapBuilder, type IdpFormValues } from "./attribute-map-builder";
import { CertPaste } from "./cert-paste";
import type { IdpConfigDto, IdpProtocol } from "@/types/api";

/**
 * IdpForm — configure a SAML/OIDC identity provider (US-001-03-01).
 * Zod mirrors the agreed `IdpCreateRequest`/`IdpUpdateRequest`; protocol
 * drives which fields render. LEES: busy submit, inline errors, success
 * closes and the list invalidates.
 */
export function IdpForm({
  open,
  onOpenChange,
  idp,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idp?: IdpConfigDto | null;
}) {
  const create = useCreateIdp();
  const update = useUpdateIdp();
  const pending = idp ? update.isPending : create.isPending;

  return (
    <Dialog open={open} onOpenChange={(next) => (pending ? undefined : onOpenChange(next))}>
      <DialogContent className="max-w-2xl">
        <IdpFormBody
          key={idp?.id ?? "new"}
          idp={idp ?? null}
          onOpenChange={onOpenChange}
          create={create}
          update={update}
        />
      </DialogContent>
    </Dialog>
  );
}

/** Inner form body, keyed by provider id so switching rows resets state (no effects). */
function IdpFormBody({
  idp,
  onOpenChange,
  create,
  update,
}: {
  idp: IdpConfigDto | null;
  onOpenChange: (open: boolean) => void;
  create: ReturnType<typeof useCreateIdp>;
  update: ReturnType<typeof useUpdateIdp>;
}) {
  const isEdit = Boolean(idp);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const pending = isEdit ? update.isPending : create.isPending;

  const schema = React.useMemo(
    () =>
      z
        .object({
          protocol: z.enum(["saml", "oidc"]),
          name: z
            .string()
            .trim()
            .min(1, { message: "Enter a provider name." })
            .max(100, { message: "Provider name must be 100 characters or fewer." }),
          issuer: z
            .string()
            .trim()
            .min(1, { message: "Enter the issuer." })
            .max(512, { message: "Issuer must be 512 characters or fewer." }),
          metadata_url: z
            .string()
            .trim()
            .max(512, { message: "Metadata URL must be 512 characters or fewer." }),
          certificate: z.string().trim().max(20000),
          client_id: z.string().trim().max(255),
          client_secret: z.string().trim().max(255),
          attributeMapping: z.array(
            z.object({
              providerAttribute: z
                .string()
                .trim()
                .min(1, { message: "Enter a provider attribute." }),
              localField: z.enum(LOCAL_ATTRIBUTE_FIELDS),
            }),
          ),
          enabled: z.boolean(),
        })
        .superRefine((data, ctx) => {
          if (data.protocol === "oidc") {
            if (!data.client_id.trim()) {
              ctx.addIssue({
                code: "custom",
                path: ["client_id"],
                message: t("idp.oidcMissingClientId"),
              });
            }
            if (!isEdit && !data.client_secret.trim()) {
              ctx.addIssue({
                code: "custom",
                path: ["client_secret"],
                message: t("idp.oidcMissingClientSecret"),
              });
            }
          }
          const certError = validateCertificate(data.certificate);
          if (certError) {
            ctx.addIssue({ code: "custom", path: ["certificate"], message: certError });
          }
        }),
    [isEdit],
  );

  const defaults: IdpFormValues = React.useMemo(
    () => ({
      protocol: idp?.protocol ?? "saml",
      name: idp?.name ?? "",
      issuer: idp?.issuer ?? "",
      metadata_url: idp?.metadata_url ?? "",
      certificate: idp?.certificate ?? "",
      client_id: idp?.client_id ?? "",
      client_secret: "",
      attributeMapping: Object.entries(idp?.attribute_mapping ?? {}).map(([attr, local]) => {
        const field = local as LocalAttributeField;
        return {
          providerAttribute: attr,
          localField: (LOCAL_ATTRIBUTE_FIELDS as readonly string[]).includes(field)
            ? field
            : ("email" as LocalAttributeField),
        };
      }),
      enabled: idp?.enabled ?? true,
    }),
    [idp],
  );

  const form = useForm<IdpFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
    mode: "onTouched",
  });

  const protocol = useWatch({ control: form.control, name: "protocol" });
  const cert = useController({ control: form.control, name: "certificate" });
  const enabled = useController({ control: form.control, name: "enabled" });

  const handleSubmit = async (values: IdpFormValues) => {
    setServerError(null);
    try {
      const base = {
        name: values.name.trim(),
        issuer: values.issuer.trim(),
        metadata_url: values.metadata_url.trim() || null,
        attribute_mapping: normalizeAttributeMapping(
          Object.fromEntries(
            values.attributeMapping.map((row) => [row.providerAttribute, row.localField]),
          ),
        ),
        enabled: values.enabled,
      };
      if (isEdit && idp) {
        await update.mutateAsync({
          id: idp.id,
          payload: {
            ...base,
            ...(values.protocol === "saml" ? { certificate: values.certificate.trim() || null } : {}),
            ...(values.protocol === "oidc"
              ? {
                  client_id: values.client_id.trim() || null,
                  ...(values.client_secret.trim() ? { client_secret: values.client_secret.trim() } : {}),
                }
              : {}),
          },
        });
      } else {
        await create.mutateAsync({
          protocol: values.protocol,
          ...base,
          ...(values.protocol === "saml" ? { certificate: values.certificate.trim() || null } : {}),
          ...(values.protocol === "oidc"
            ? {
                client_id: values.client_id.trim() || null,
                client_secret: values.client_secret.trim(),
              }
            : {}),
        });
      }
      onOpenChange(false);
    } catch (error) {
      setServerError(toAppError(error).userMessage || t("common.somethingWentWrong"));
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} noValidate>
      <DialogHeader>
        <DialogTitle>
          {isEdit ? t("idp.editTitle", { name: idp?.name ?? "" }) : t("idp.createTitle")}
        </DialogTitle>
        <DialogDescription>
          {isEdit ? t("idp.editDescription") : t("idp.createDescription")}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="idp-protocol">
            {t("idp.protocol")} <RequiredIndicator />
          </Label>
          <Select
            value={form.getValues("protocol")}
            onValueChange={(value) => form.setValue("protocol", value as IdpProtocol, { shouldDirty: true })}
            disabled={isEdit}
          >
            <SelectTrigger id="idp-protocol" aria-invalid={Boolean(form.formState.errors.protocol)}>
              <SelectValue placeholder={t("idp.protocolPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {IDP_PROTOCOLS.map((protocolOption) => (
                <SelectItem key={protocolOption} value={protocolOption}>
                  {t(protocolOption === "saml" ? "idp.saml" : "idp.oidc")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="idp-name">
            {t("idp.name")} <RequiredIndicator />
          </Label>
          <Input
            id="idp-name"
            {...form.register("name")}
            invalid={Boolean(form.formState.errors.name)}
          />
          {form.formState.errors.name ? (
            <p className="text-sm text-danger-text" data-testid="idp-name-error">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="idp-issuer">
            {t("idp.issuer")} <RequiredIndicator />
          </Label>
          <Input
            id="idp-issuer"
            {...form.register("issuer")}
            invalid={Boolean(form.formState.errors.issuer)}
          />
          <p className="text-xs text-muted">{t("idp.issuerHint")}</p>
          {form.formState.errors.issuer ? (
            <p className="text-sm text-danger-text" data-testid="idp-issuer-error">
              {form.formState.errors.issuer.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="idp-metadata-url">{t("idp.metadataUrl")}</Label>
          <Input
            id="idp-metadata-url"
            {...form.register("metadata_url")}
            invalid={Boolean(form.formState.errors.metadata_url)}
          />
          <p className="text-xs text-muted">{t("idp.metadataUrlHint")}</p>
          {form.formState.errors.metadata_url ? (
            <p className="text-sm text-danger-text" data-testid="idp-metadata-error">
              {form.formState.errors.metadata_url.message}
            </p>
          ) : null}
        </div>

        {isSaml(protocol) ? (
          <CertPaste
            id="idp-certificate"
            value={cert.field.value}
            onChange={(value) => cert.field.onChange(value)}
            invalid={Boolean(cert.fieldState.error)}
            error={cert.fieldState.error?.message ?? null}
          />
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="idp-client-id">
                {t("idp.clientId")} <RequiredIndicator />
              </Label>
              <Input
                id="idp-client-id"
                {...form.register("client_id")}
                invalid={Boolean(form.formState.errors.client_id)}
              />
              {form.formState.errors.client_id ? (
                <p className="text-sm text-danger-text" data-testid="idp-client-id-error">
                  {form.formState.errors.client_id.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="idp-client-secret">
                {t("idp.clientSecret")} {!isEdit ? <RequiredIndicator /> : null}
              </Label>
              <Input
                id="idp-client-secret"
                type="password"
                autoComplete="new-password"
                {...form.register("client_secret")}
                invalid={Boolean(form.formState.errors.client_secret)}
              />
              <p className="text-xs text-muted">{t("idp.clientSecretHint")}</p>
              {form.formState.errors.client_secret ? (
                <p className="text-sm text-danger-text" data-testid="idp-client-secret-error">
                  {form.formState.errors.client_secret.message}
                </p>
              ) : null}
            </div>
          </>
        )}

        <AttributeMapBuilder control={form.control} />

        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-subtle/40 px-3 py-2">
          <Label htmlFor="idp-enabled">{t("idp.enabled")}</Label>
          <Switch
            id="idp-enabled"
            checked={enabled.field.value}
            onCheckedChange={(checked) => enabled.field.onChange(checked)}
          />
        </div>

        {serverError ? (
          <p
            role="alert"
            data-testid="idp-server-error"
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
          {isEdit ? t("idp.save") : t("idp.create")}
        </Button>
      </DialogFooter>
    </form>
  );
}
