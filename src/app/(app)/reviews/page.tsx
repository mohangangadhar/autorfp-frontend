import { ShieldCheck } from "lucide-react";
import { PagePlaceholder } from "@/components/core/page-placeholder";

export default function ReviewsPage() {
  return (
    <PagePlaceholder
      titleKey="reviews.title"
      descriptionKey="reviews.description"
      icon={<ShieldCheck aria-hidden className="size-6" />}
    />
  );
}