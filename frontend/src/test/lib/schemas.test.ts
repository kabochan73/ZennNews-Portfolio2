import { describe, expect, test } from "vitest";

import { loginSchema, registerSchema } from "@/lib/schemas";

/** The first error message of each field, like React Hook Form shows them. */
function firstErrors(result: {
  success: boolean;
  error?: { issues: { path: PropertyKey[]; message: string }[] };
}): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of result.error?.issues ?? []) {
    errors[String(issue.path[0])] ??= issue.message;
  }

  return errors;
}

describe("registerSchema", () => {
  const valid = {
    username: "Takumi_K",
    password: "password123",
    password_confirmation: "password123",
  };

  test("accepts a valid input", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  test("requires every field", () => {
    const result = registerSchema.safeParse({
      username: "",
      password: "",
      password_confirmation: "",
    });

    expect(firstErrors(result)).toEqual({
      username: "ユーザー名を入力してください",
      password: "パスワードを入力してください",
    });
  });

  test.each(["ab", "a".repeat(21), "taku-mi", "taku mi", "たくみ"])(
    "rejects the username %s",
    (username) => {
      expect(
        firstErrors(registerSchema.safeParse({ ...valid, username })),
      ).toEqual({
        username: "ユーザー名は半角英数字と_で、3〜20文字で入力してください",
      });
    },
  );

  test("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: "short",
      password_confirmation: "short",
    });

    expect(firstErrors(result)).toEqual({
      password: "パスワードは8文字以上で入力してください",
    });
  });

  test("rejects a confirmation that doesn't match", () => {
    const result = registerSchema.safeParse({
      ...valid,
      password_confirmation: "password124",
    });

    expect(firstErrors(result)).toEqual({
      password_confirmation: "パスワードが一致しません",
    });
  });
});

describe("loginSchema", () => {
  test("accepts any non-empty username and password", () => {
    expect(
      loginSchema.safeParse({ username: "x", password: "y" }).success,
    ).toBe(true);
  });

  test("requires both fields", () => {
    expect(
      firstErrors(loginSchema.safeParse({ username: "", password: "" })),
    ).toEqual({
      username: "ユーザー名を入力してください",
      password: "パスワードを入力してください",
    });
  });
});
