import { Settings } from "lucide-react";
import { PagePlaceholder } from "@/components/core/page-placeholder";

export default function AdminPage() {
  return (
    <PagePlaceholder
      titleKey="admin.title"
      descriptionKey="admin.description"
      icon={<Settings aria-hidden className="size-6" />}
    />
  );
}