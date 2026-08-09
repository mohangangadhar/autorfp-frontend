import {
  BarChart3,
  BookOpen,
  Boxes,
  FolderKanban,
  GaugeCircle,
  Shield,
  ShieldCheck,
  FileText,
  ClipboardList,
  Landmark,
  AlarmClock,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { MessageKey } from "@/lib/i18n/messages";
import type { Capability } from "@/lib/rbac/permissions";

export interface NavItem {
  key: string;
  labelKey: MessageKey;
  href: string;
  icon: LucideIcon;
  /** Null = visible to any authenticated user; otherwise a capability gate. */
  permission: Capability | null;
}

/** Top-level navigation (routing-design §1.2) gated by capability. */
export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", labelKey: "nav.dashboard", href: "/dashboard", icon: BarChart3, permission: null },
  { key: "projects", labelKey: "nav.projects", href: "/projects", icon: FolderKanban, permission: "document.read" },
  { key: "documents", labelKey: "nav.documents", href: "/documents", icon: FileText, permission: "document.read" },
  { key: "knowledge", labelKey: "nav.knowledge", href: "/knowledge", icon: BookOpen, permission: "document.read" },
  { key: "requirements", labelKey: "nav.requirements", href: "/requirements", icon: ClipboardList, permission: "requirement.read" },
  { key: "capabilities", labelKey: "nav.capabilities", href: "/capabilities", icon: Boxes, permission: "capability.read" },
  { key: "evidence", labelKey: "nav.evidence", href: "/evidence", icon: Shield, permission: "evidence.read" },
  { key: "compliance", labelKey: "nav.compliance", href: "/compliance", icon: Landmark, permission: "compliance.read" },
  { key: "risk", labelKey: "nav.risk", href: "/risk", icon: GaugeCircle, permission: "risk.read" },
  { key: "proposals", labelKey: "nav.proposals", href: "/proposals", icon: FileText, permission: "proposal.read" },
  { key: "reviews", labelKey: "nav.reviews", href: "/reviews", icon: ShieldCheck, permission: "review.read" },
  { key: "notifications", labelKey: "nav.notifications", href: "/notifications", icon: AlarmClock, permission: "notification.read" },
];

/** Admin section (FE-AD): always `admin.read`-gated. */
export const ADMIN_NAV_ITEM: NavItem = {
  key: "admin",
  labelKey: "nav.admin",
  href: "/admin",
  icon: Settings,
  permission: "admin.read",
};

export function findNavItem(href: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => item.href === href);
}