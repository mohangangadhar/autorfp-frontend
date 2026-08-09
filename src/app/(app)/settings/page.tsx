import { UserRound } from "lucide-react";
import { PagePlaceholder } from "@/components/core/page-placeholder";

export default function SettingsPage() {
  return (
    <PagePlaceholder
      titleKey="settings.title"
      descriptionKey="settings.description"
      icon={<UserRound aria-hidden className="size-6" />}
    />
  );
}