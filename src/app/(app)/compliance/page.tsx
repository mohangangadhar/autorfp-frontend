import { Landmark } from "lucide-react";
import { PagePlaceholder } from "@/components/core/page-placeholder";

export default function CompliancePage() {
  return (
    <PagePlaceholder
      titleKey="compliance.title"
      descriptionKey="compliance.description"
      icon={<Landmark aria-hidden className="size-6" />}
    />
  );
}