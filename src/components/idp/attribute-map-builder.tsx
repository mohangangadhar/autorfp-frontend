"use client";

import * as React from "react";
import { useController, useFieldArray, type Control } from "react-hook-form";
import { Plus, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { LOCAL_ATTRIBUTE_FIELDS, type LocalAttributeField } from "@/lib/idp/contract";
import type { IdpProtocol } from "@/types/api";

export interface IdpMappingRow {
  providerAttribute: string;
  localField: LocalAttributeField;
}

export const NEW_MAPPING_ROW: IdpMappingRow = { providerAttribute: "", localField: "email" };

/** Shared IdP form value shape (create + edit). */
export type IdpFormValues = {
  protocol: IdpProtocol;
  name: string;
  issuer: string;
  metadata_url: string;
  certificate: string;
  client_id: string;
  client_secret: string;
  attributeMapping: IdpMappingRow[];
  enabled: boolean;
};

/**
 * AttributeMapBuilder — provider attribute → local user field rows
 * (US-001-03-01). Controlled via `useFieldArray`; rows convert to a
 * `Record` on submit (`normalizeAttributeMapping`).
 */
export function AttributeMapBuilder({ control }: { control: Control<IdpFormValues> }) {
  const { fields, append, remove } = useFieldArray<IdpFormValues>({
    control,
    name: "attributeMapping",
  });

  return (
    <div className="space-y-3" data-testid="attribute-map-builder">
      <div className="space-y-1">
        <span className="text-sm font-medium text-primary">{t("idp.attributeMapping")}</span>
        <p className="text-xs text-muted">{t("idp.attributeMappingHint")}</p>
      </div>

      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <Input
              aria-label={t("idp.providerAttribute")}
              placeholder={t("idp.providerAttribute")}
              className="flex-1"
              {...control.register(`attributeMapping.${index}.providerAttribute` as const)}
            />
            <LocalFieldSelect control={control} index={index} />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
              aria-label={t("idp.removeMapping")}
            >
              <X aria-hidden className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      {fields.length === 0 ? (
        <p className="text-xs text-muted" data-testid="no-mappings">
          {t("idp.attributeMappingHint")}
        </p>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append(NEW_MAPPING_ROW)}
        data-testid="add-mapping"
      >
        <Plus aria-hidden className="size-4" />
        {t("idp.addMapping")}
      </Button>
    </div>
  );
}

function LocalFieldSelect({
  control,
  index,
}: {
  control: Control<IdpFormValues>;
  index: number;
}) {
  const { field } = useController<IdpFormValues>({
    control,
    name: `attributeMapping.${index}.localField`,
  });

  return (
    <Select value={String(field.value)} onValueChange={field.onChange} aria-label={t("idp.localFieldColumn")}>
      <SelectTrigger className="w-40" aria-label={t("idp.localFieldColumn")}>
        <SelectValue placeholder={t("idp.localFieldPlaceholder")} />
      </SelectTrigger>
      <SelectContent>
        {LOCAL_ATTRIBUTE_FIELDS.map((localField) => (
          <SelectItem key={localField} value={localField}>
            {t(`idp.localField.${localField}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
