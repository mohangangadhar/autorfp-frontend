"use client";

import * as React from "react";
import { useIdpTestConnection } from "@/lib/queries/idp";
import { toAppError } from "@/lib/api/error";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { IdpConfigDto, TestConnectionResponse } from "@/types/api";

/**
 * TestConnectionButton — validates a saved provider (US-001-03-01).
 * Renders the detailed success/failure inline below the button (LEES);
 * a transport/backend error surfaces as a danger banner.
 */
export function TestConnectionButton({ idp }: { idp: IdpConfigDto }) {
  const test = useIdpTestConnection();
  const [result, setResult] = React.useState<TestConnectionResponse | null>(null);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const pending = test.isPending;

  const run = async () => {
    setResult(null);
    setServerError(null);
    try {
      setResult(await test.mutateAsync(idp.id));
    } catch (error) {
      setServerError(toAppError(error).userMessage || t("common.somethingWentWrong"));
    }
  };

  return (
    <div className="space-y-2" data-testid="test-connection">
      <Button type="button" variant="outline" size="sm" onClick={() => void run()} isLoading={pending}>
        {pending ? t("idp.testing") : t("idp.testConnection")}
      </Button>

      {result ? (
        <div
          role="status"
          data-testid="test-connection-result"
          className={cn(
            "rounded-md px-3 py-2 text-sm",
            result.success ? "bg-success-bg text-success-text" : "bg-danger-bg text-danger-text",
          )}
        >
          <p className="font-medium">
            {result.success ? t("idp.testSuccess") : t("idp.testFailure")}
          </p>
          <p className="mt-0.5 text-xs">{result.message}</p>
          {result.details && Object.keys(result.details).length > 0 ? (
            <dl className="mt-1 grid gap-0.5 text-xs" data-testid="test-connection-details">
              {Object.entries(result.details).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <dt className="font-medium">{key}:</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      ) : null}

      {serverError ? (
        <p
          role="alert"
          data-testid="test-connection-error"
          className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text"
        >
          {serverError}
        </p>
      ) : null}
    </div>
  );
}
