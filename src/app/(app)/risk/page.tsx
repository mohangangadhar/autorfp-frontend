import { GaugeCircle } from "lucide-react";
import { PagePlaceholder } from "@/components/core/page-placeholder";

export default function RiskPage() {
  return (
    <PagePlaceholder
      titleKey="risk.title"
      descriptionKey="risk.description"
      icon={<GaugeCircle aria-hidden className="size-6" />}
    />
  );
}