import { FolderKanban } from "lucide-react";
import { PagePlaceholder } from "@/components/core/page-placeholder";

export default function ProjectsPage() {
  return (
    <PagePlaceholder
      titleKey="projects.title"
      descriptionKey="projects.description"
      icon={<FolderKanban aria-hidden className="size-6" />}
    />
  );
}