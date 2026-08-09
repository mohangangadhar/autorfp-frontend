import Link from "next/link";
import type { Metadata } from "next";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-on-brand">
            A
          </span>
          <span className="text-lg font-semibold tracking-wide text-primary">{t("app.name")}</span>
        </Link>
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8">{children}</div>
      </div>
    </div>
  );
}