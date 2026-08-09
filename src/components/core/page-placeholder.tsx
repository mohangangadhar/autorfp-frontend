import type { ReactNode } from "react";
import { t } from "@/lib/i18n";

/**
 * Placeholder screen for module routes whose product workflows are
 * out of scope for the FE foundation cliff. Renders a consistent,
 * accessible scaffold that route map tests can assert against.
 */
export function PagePlaceholder({
  titleKey,
  descriptionKey,
  icon,
}: {
  titleKey: string;
  descriptionKey: string;
  icon?: ReactNode;
}) {
  return (
    <div
      data-testid="page-placeholder"
      className="flex flex-col items-start gap-2 py-6"
    >
      {icon ? <div className="flex size-12 items-center justify-center rounded-xl bg-subtle text-muted">{icon}</div> : null}
      <h1 className="text-2xl font-semibold tracking-tight text-primary">{t(titleKey)}</h1>
      <p className="max-w-prose text-sm text-secondary">{t(descriptionKey)}</p>
    </div>
  );
}