import { Shield } from "lucide-react";
import { PagePlaceholder } from "@/components/core/page-placeholder";

export default function EvidencePage() {
  return (
    <PagePlaceholder
      titleKey="evidence.title"
      descriptionKey="evidence.description"
      icon={<Shield aria-hidden className="size-6" />}
    />
  );
}