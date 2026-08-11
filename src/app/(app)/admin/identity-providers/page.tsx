import type { Metadata } from "next";
import { IdpsPage } from "@/components/idp/idps-page";

export const metadata: Metadata = { title: "Identity providers" };

export default function IdentityProvidersPage() {
  return <IdpsPage />;
}
