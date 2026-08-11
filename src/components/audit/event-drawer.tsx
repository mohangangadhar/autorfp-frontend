"use client";

import type { AuditLogDto } from "@/types/api";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { formatActor, formatChangeValue, formatEventTime } from "@/lib/audit/contract";
import { t } from "@/lib/i18n";

/**
 * `/admin/audit` — event details drawer (FE-AD-01 / ui/11-drawers).
 * Right-side slide-in surfacing every immutable field of one event:
 * actor, action, resource, changes, IP, user agent, timestamps.
 */
export function EventDrawer({
  event,
  open,
  onOpenChange,
}: {
  event: AuditLogDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent aria-describedby={undefined}>
        <DrawerHeader>
          <DrawerTitle className="font-mono text-sm text-brand-500">
            {event?.action ?? ""}
          </DrawerTitle>
          <DrawerDescription>
            {event ? formatEventTime(event.created_at) : ""}
          </DrawerDescription>
        </DrawerHeader>
        {event ? <DetailList event={event} /> : null}
      </DrawerContent>
    </Drawer>
  );
}

function DetailList({ event }: { event: AuditLogDto }) {
  return (
    <dl className="mt-4 space-y-4" data-testid="event-drawer-details">
      <Row label={t("audit.drawerAction")}>
        <span className="font-mono text-sm text-primary">{event.action}</span>
      </Row>
      <Row label={t("audit.drawerActor")}>
        <span className="font-mono text-sm text-primary">
          {formatActor(event.user_id)}
          {event.user_id ? <span className="text-muted"> ({event.user_id})</span> : null}
        </span>
      </Row>
      <Row label={t("audit.drawerTime")}>
        <span className="text-sm text-primary">{formatEventTime(event.created_at)}</span>
      </Row>
      <Row label={t("audit.drawerResourceType")}>
        <span className="font-mono text-sm text-primary">{event.entity_type}</span>
      </Row>
      <Row label={t("audit.drawerResourceId")}>
        <span className="font-mono text-sm text-primary">{event.entity_id || "—"}</span>
      </Row>
      <Row label={t("audit.drawerOrganization")}>
        <span className="font-mono text-sm text-primary">{event.organization_id}</span>
      </Row>
      <Row label={t("audit.drawerIp")}>
        <span className="font-mono text-sm text-primary">{event.ip_address ?? "—"}</span>
      </Row>
      <Row label={t("audit.drawerUserAgent")}>
        <span className="break-all text-sm text-primary">{event.user_agent ?? "—"}</span>
      </Row>
      <Row label={t("audit.drawerChanges")}>
        <ChangesList changes={event.changes} />
      </Row>
    </dl>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}

function ChangesList({ changes }: { changes: Record<string, unknown> | null }) {
  if (!changes || Object.keys(changes).length === 0) {
    return <span className="text-sm text-muted">{t("audit.noChanges")}</span>;
  }
  return (
    <ul className="space-y-1.5">
      {Object.entries(changes).map(([key, value]) => (
        <li key={key} className="text-sm">
          <span className="font-medium text-primary">{key}:</span>{" "}
          <span className="break-all text-muted">{formatChangeValue(value) || "—"}</span>
        </li>
      ))}
    </ul>
  );
}
