"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from "@/lib/i18n";

const forgotSchema = z.object({
  email: z.string().trim().min(1, { message: "Enter your email." }).email({ message: "Enter a valid email address." }),
});

type ForgotValues = z.infer<typeof forgotSchema>;

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) });

  const onSubmit = async () => {
    setSent(true);
  };

  if (sent) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-primary">Check your inbox</h1>
        <p className="text-sm text-muted">
          If an account exists for that email, we&apos;ve sent a password reset link.
        </p>
        <Button asChild variant="secondary" className="w-full">
          <Link href="/login">{t("common.backToHome")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-primary">Reset your password</h1>
        <p className="mt-1 text-sm text-muted">Enter your account email and we&apos;ll send you a reset link.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t("auth.email")}</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email ? <p className="text-sm text-danger-text">{errors.email.message}</p> : null}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t("common.loading") : "Send reset link"}
      </Button>

      <p className="text-center text-sm text-muted">
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}