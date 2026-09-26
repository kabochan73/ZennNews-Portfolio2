import { z } from "zod";

/**
 * Form validation in the browser, mirroring Laravel's rules and messages
 * (RegisterRequest / LoginRequest). Laravel still validates every request;
 * checks such as a taken username only happen there.
 */

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(1, { error: "ユーザー名を入力してください" })
      .regex(/^[A-Za-z0-9_]{3,20}$/, {
        error: "ユーザー名は半角英数字と_で、3〜20文字で入力してください",
      }),
    password: z
      .string()
      .min(1, { error: "パスワードを入力してください" })
      .min(8, { error: "パスワードは8文字以上で入力してください" }),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    error: "パスワードが一致しません",
    path: ["password_confirmation"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  username: z.string().min(1, { error: "ユーザー名を入力してください" }),
  password: z.string().min(1, { error: "パスワードを入力してください" }),
});

export type LoginInput = z.infer<typeof loginSchema>;
