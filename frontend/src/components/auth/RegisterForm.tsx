"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { applyApiError } from "@/components/auth/form-errors";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { apiFetch } from "@/lib/api-client";
import { type RegisterInput, registerSchema } from "@/lib/schemas";

export function RegisterForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit(async (input) => {
    setFormError(null);
    try {
      // apiFetch directly (not useMutation), so errors here never trigger the
      // global "login expired" redirect.
      await apiFetch("/auth/register", { method: "POST", body: input });
    } catch (error) {
      applyApiError(error, setError, setFormError);
      return;
    }

    // Drop anything cached for a previous account before entering the app.
    queryClient.clear();
    router.replace("/home/tags?welcome=1");
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {formError && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {formError}
        </p>
      )}
      <TextField
        label="ユーザー名"
        hint="半角英数字と_、3〜20文字"
        autoComplete="username"
        error={errors.username?.message}
        {...register("username")}
      />
      <TextField
        label="パスワード"
        type="password"
        hint="8文字以上"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <TextField
        label="パスワード（確認）"
        type="password"
        autoComplete="new-password"
        error={errors.password_confirmation?.message}
        {...register("password_confirmation")}
      />
      <Button type="submit" loading={isSubmitting}>
        アカウントを作成
      </Button>
    </form>
  );
}
