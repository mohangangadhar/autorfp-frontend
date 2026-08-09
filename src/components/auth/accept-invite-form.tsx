"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from "@/lib/i18n";

const acceptSchema = z.object({
  name: z.string().trim().min(1, { message: "Enter your name." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
});

type AcceptValues = z.infer<typeof acceptSchema>;

export function AcceptInviteForm({ token }: { token?: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptValues>({ resolver: zodResolver(acceptSchema) });

  const onSubmit = async (values: AcceptValues) => {
    setServerError(null);
    try {
      const response = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...values, token }),
        credentials: "same-origin",
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Could not accept this invitation.");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : t("common.somethingWentWrong"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-primary">{t("auth.acceptInvite")}</h1>
        <p className="mt-1 text-sm text-muted">{t("auth.registerSubtitle")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" autoComplete="name" {...register("name")} />
        {errors.name ? <p className="text-sm text-danger-text">{errors.name.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("auth.password")}</Label>
        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
        {errors.password ? <p className="text-sm text-danger-text">{errors.password.message}</p> : null}
      </div>

      {serverError ? (
        <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text">
          {serverError}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t("common.loading") : t("auth.acceptInvite")}
      </Button>
    </form>
  );
}