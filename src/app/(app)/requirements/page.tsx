import { ClipboardList } from "lucide-react";
import { PagePlaceholder } from "@/components/core/page-placeholder";

export default function RequirementsPage() {
  return (
    <PagePlaceholder
      titleKey="requirements.title"
      descriptionKey="requirements.description"
      icon={<ClipboardList aria-hidden className="size-6" />}
    />
  );
}