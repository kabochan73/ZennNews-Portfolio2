"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { applyApiError } from "@/components/auth/form-errors";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { apiFetch } from "@/lib/api-client";
import { type LoginInput, loginSchema } from "@/lib/schemas";

export function LoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (input) => {
    setFormError(null);
    try {
      // apiFetch directly (not useMutation): a 401 here means wrong credentials,
      // not an expired login, so the global redirect must not run.
      await apiFetch("/auth/login", { method: "POST", body: input });
    } catch (error) {
      applyApiError(error, setError, setFormError);
      return;
    }

    // Drop anything cached for a previous account before entering the app.
    queryClient.clear();
    router.replace("/home");
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
        autoComplete="username"
        error={errors.username?.message}
        {...register("username")}
      />
      <TextField
        label="パスワード"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <Button type="submit" loading={isSubmitting}>
        ログイン
      </Button>
    </form>
  );
}

/**
 * "ログインし直してください" after an expired login (/login?expired=1).
 * Kept apart from the form because reading the URL must sit inside Suspense,
 * while the form itself stays in the static HTML.
 */
export function LoginExpiredNotice() {
  const searchParams = useSearchParams();

  if (searchParams.get("expired") !== "1") {
    return null;
  }

  return (
    <p role="status" className="rounded-lg bg-neutral-100 p-3 text-sm">
      ログインし直してください
    </p>
  );
}
