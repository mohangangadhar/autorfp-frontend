import type { Metadata } from "next";
import { UsagePage } from "@/components/usage/usage-page";

export const metadata: Metadata = { title: "Usage analytics" };

export default function UsagePageRoute() {
  return <UsagePage />;
}
