import { FileText } from "lucide-react";
import { PagePlaceholder } from "@/components/core/page-placeholder";

export default function ProposalsPage() {
  return (
    <PagePlaceholder
      titleKey="proposals.title"
      descriptionKey="proposals.description"
      icon={<FileText aria-hidden className="size-6" />}
    />
  );
}