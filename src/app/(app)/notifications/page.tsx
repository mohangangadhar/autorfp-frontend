import { AlarmClock } from "lucide-react";
import { PagePlaceholder } from "@/components/core/page-placeholder";

export default function NotificationsPage() {
  return (
    <PagePlaceholder
      titleKey="notifications.title"
      descriptionKey="notifications.description"
      icon={<AlarmClock aria-hidden className="size-6" />}
    />
  );
}