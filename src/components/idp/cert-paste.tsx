"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { t } from "@/lib/i18n";

/**
 * CertPaste — SAML signing certificate paste area (US-001-03-01).
 * Controlled; validation lives in the parent form (see `validateCertificate`).
 * The hint/marker text stays i18n-driven; error is rendered inline (LEES).
 */
export function CertPaste({
  id,
  value,
  onChange,
  invalid,
  error,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  error?: string | null;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{t("idp.certificateLabel")}</Label>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        invalid={invalid}
        className="min-h-28 font-mono text-xs leading-relaxed"
        placeholder={t("idp.certificatePlaceholder")}
        aria-describedby={error ? `${id}-error` : `${id}-hint`}
      />
      {error ? (
        <p className="text-sm text-danger-text" id={`${id}-error`} data-testid="cert-error">
          {error}
        </p>
      ) : (
        <p className="text-xs text-muted" id={`${id}-hint`}>
          {t("idp.certificateHint")}
        </p>
      )}
    </div>
  );
}
