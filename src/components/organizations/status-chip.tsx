import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { OrganizationStatus } from "@/types/api";

/**
 * Org lifecycle status chip (TDD-020 state machine) mapping statuses to
 * badge tones. Unknown statuses fall back to neutral. (ui/22-status-indicators.md)
 */
const STATUS_TONES: Record<OrganizationStatus, NonNullable<BadgeProps["tone"]>> = {
  provisioning: "info",
  active: "success",
  suspended: "warning",
  archived: "neutral",
};

export function statusTone(status: string): NonNullable<BadgeProps["tone"]> {
  return STATUS_TONES[status as OrganizationStatus] ?? "neutral";
}

export function StatusChip({ status }: { status: string }) {
  return (
    <Badge tone={statusTone(status)} data-testid="status-chip">
      {status}
    </Badge>
  );
}
