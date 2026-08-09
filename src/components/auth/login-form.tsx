"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { bffLogin } from "@/lib/auth/bff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from "@/lib/i18n";

const loginSchema = z.object({
  email: z.string().trim().min(1, { message: "Enter your email." }).email({ message: "Enter a valid email address." }),
  password: z.string().min(1, { message: "Enter your password." }),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    try {
      await bffLogin(values.email, values.password);
      router.push(next || "/dashboard");
      router.refresh();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : t("common.somethingWentWrong"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-primary">{t("auth.loginTitle")}</h1>
        <p className="mt-1 text-sm text-muted">{t("auth.loginSubtitle")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t("auth.email")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@company.com"
          aria-invalid={errors.email ? true : undefined}
          {...register("email")}
        />
        {errors.email ? <p className="text-sm text-danger-text">{errors.email.message}</p> : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t("auth.password")}</Label>
          <Link href="/forgot-password" className="text-sm text-brand-600 hover:underline">
            {t("auth.forgotPassword")}
          </Link>
        </div>
        <Input id="password" type="password" autoComplete="current-password" aria-invalid={errors.password ? true : undefined} {...register("password")} />
        {errors.password ? <p className="text-sm text-danger-text">{errors.password.message}</p> : null}
      </div>

      {serverError ? (
        <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text">
          {serverError}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t("common.loading") : t("common.signIn")}
      </Button>

      <p className="text-center text-sm text-muted">
        {t("auth.noAccount")}{" "}
        <Link href="/register" className="font-medium text-brand-600 hover:underline">
          {t("auth.register")}
        </Link>
      </p>
    </form>
  );
}