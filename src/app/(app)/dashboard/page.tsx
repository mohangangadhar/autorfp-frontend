import { BarChart3 } from "lucide-react";
import { PagePlaceholder } from "@/components/core/page-placeholder";

export default function DashboardPage() {
  return (
    <PagePlaceholder
      titleKey="dashboard.title"
      descriptionKey="dashboard.description"
      icon={<BarChart3 aria-hidden className="size-6" />}
    />
  );
}