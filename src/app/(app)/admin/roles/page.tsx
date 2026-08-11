import type { Metadata } from "next";
import { RolesPage } from "@/components/roles/roles-page";

export const metadata: Metadata = { title: "Roles" };

export default function RolesPageRoute() {
  return <RolesPage />;
}
