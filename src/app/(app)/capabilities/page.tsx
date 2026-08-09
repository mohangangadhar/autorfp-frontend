import { Boxes } from "lucide-react";
import { PagePlaceholder } from "@/components/core/page-placeholder";

export default function CapabilitiesPage() {
  return (
    <PagePlaceholder
      titleKey="capabilities.title"
      descriptionKey="capabilities.description"
      icon={<Boxes aria-hidden className="size-6" />}
    />
  );
}