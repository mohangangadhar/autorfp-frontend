"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { t } from "@/lib/i18n";
import {
  PERMISSION_GROUPS,
  PERMISSION_LABEL_KEYS,
  bitmapToNames,
  namesToBitmap,
  type PermissionBitName,
} from "@/lib/rbac/bitmap";
import { cn } from "@/lib/utils/cn";

/**
 * PermissionMatrix — grouped permission tree (US-001-02-03). Renders one
 * group per module with a select-all header and per-permission checkboxes.
 * Controlled by a `permission_bitmap` integer; `onChange` emits the new
 * bitmap. Disabled for predefined roles (backend rejects edits with 400).
 */
export function PermissionMatrix({
  bitmap,
  onChange,
  disabled = false,
}: {
  bitmap: number;
  onChange: (bitmap: number) => void;
  disabled?: boolean;
}) {
  const selected = React.useMemo(() => bitmapToNames(bitmap), [bitmap]);

  const toggle = (name: PermissionBitName, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(name);
    else next.delete(name);
    onChange(namesToBitmap(next));
  };

  const toggleGroup = (group: readonly PermissionBitName[], checked: boolean) => {
    const next = new Set(selected);
    for (const name of group) {
      if (checked) next.add(name);
      else next.delete(name);
    }
    onChange(namesToBitmap(next));
  };

  return (
    <fieldset disabled={disabled} data-testid="permission-matrix">
      <div className="space-y-4">
        {PERMISSION_GROUPS.map((group) => {
          const groupSelected = group.permissions.filter((name) => selected.has(name)).length;
          const allChecked = groupSelected === group.permissions.length;
          const indeterminate = groupSelected > 0 && !allChecked;
          return (
            <GroupRow
              key={group.labelKey}
              label={t(group.labelKey)}
              allChecked={allChecked}
              indeterminate={indeterminate}
              onToggleGroup={(checked) => toggleGroup(group.permissions, checked)}
            >
              {group.permissions.map((name) => (
                <PermissionRow
                  key={name}
                  name={name}
                  label={t(PERMISSION_LABEL_KEYS[name])}
                  checked={selected.has(name)}
                  disabled={disabled}
                  onToggle={(checked) => toggle(name, checked)}
                />
              ))}
            </GroupRow>
          );
        })}
      </div>
    </fieldset>
  );
}

function GroupRow({
  label,
  allChecked,
  indeterminate,
  onToggleGroup,
  children,
}: {
  label: string;
  allChecked: boolean;
  indeterminate: boolean;
  onToggleGroup: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-subtle/40",
        allChecked && "border-success/40",
      )}
      data-testid="permission-group"
    >
      <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-medium text-primary">
        <Checkbox
          ref={ref}
          checked={allChecked}
          aria-checked={indeterminate ? "mixed" : allChecked}
          onChange={(event) => onToggleGroup(event.target.checked)}
        />
        {label}
      </label>
      <div className="grid gap-1 px-3 pb-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function PermissionRow({
  name,
  label,
  checked,
  disabled,
  onToggle,
}: {
  name: PermissionBitName;
  label: string;
  checked: boolean;
  disabled: boolean;
  onToggle: (checked: boolean) => void;
}) {
  return (
    <label
      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-secondary hover:bg-subtle"
      data-permission={name}
    >
      <Checkbox
        checked={checked}
        disabled={disabled}
        onChange={(event) => onToggle(event.target.checked)}
      />
      {label}
    </label>
  );
}
