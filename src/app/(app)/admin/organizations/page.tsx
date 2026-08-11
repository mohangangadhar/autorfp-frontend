import type { Metadata } from "next";
import { OrganizationsList } from "@/components/organizations/organizations-list";

export const metadata: Metadata = { title: "Organizations" };

export default function OrganizationsPage() {
  return <OrganizationsList />;
}