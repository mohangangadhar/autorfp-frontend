import { FileText } from "lucide-react";
import { PagePlaceholder } from "@/components/core/page-placeholder";

export default function DocumentsPage() {
  return (
    <PagePlaceholder
      titleKey="documents.title"
      descriptionKey="documents.description"
      icon={<FileText aria-hidden className="size-6" />}
    />
  );
}