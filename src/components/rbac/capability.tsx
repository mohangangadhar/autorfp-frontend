"use client";

import * as React from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Capability } from "@/lib/rbac/permissions";

/**
 * Capability gate (authorization-design.md §4). Renders children only
 * when the session can() the given permission. When hidden and `silent`
 * is false the component renders nothing (it is not an enforcement
 * point — the backend decides).
 */
export function Capability({
  permission,
  children,
  fallback = null,
}: {
  permission: Capability;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { can } = useAuth();
  return can(permission) ? <>{children}</> : <>{fallback}</>;
}

/** Nav entry gate — hides children entirely when the permission is missing. */
export function NavGate({
  permission,
  children,
}: {
  permission: Capability;
  children: React.ReactNode;
}) {
  return (
    <Capability permission={permission} fallback={null}>
      {children}
    </Capability>
  );
}

/** Action button gate — disables + tooltip instead of hiding (§7 tooltip). */
export function ButtonGate({
  permission,
  children,
}: {
  permission: Capability;
  children: React.ReactElement<{ disabled?: boolean }>;
}) {
  const { can } = useAuth();
  if (can(permission)) return children;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{renderDisabled(children)}</TooltipTrigger>
        <TooltipContent>Requires {permission} permission.</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function renderDisabled(node: React.ReactNode): React.ReactElement {
  const element = node as React.ReactElement<{ disabled?: boolean }>;
  return React.cloneElement(element, { disabled: true });
}