import type { Metadata } from "next";
import { OrganizationCreateWizard } from "@/components/organizations/organization-create-wizard";

export const metadata: Metadata = { title: "New organization" };

export default function NewOrganizationPage() {
  return <OrganizationCreateWizard mode="admin" />;
}