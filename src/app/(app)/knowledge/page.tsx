import { BookOpen } from "lucide-react";
import { PagePlaceholder } from "@/components/core/page-placeholder";

export default function KnowledgePage() {
  return (
    <PagePlaceholder
      titleKey="knowledge.title"
      descriptionKey="knowledge.description"
      icon={<BookOpen aria-hidden className="size-6" />}
    />
  );
}