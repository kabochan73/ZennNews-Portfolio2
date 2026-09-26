import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { ApiClientError } from "@/lib/api-client";

/**
 * Show an API error on the form: 422 validation errors go under their fields;
 * anything else (401 wrong credentials, 429 too many attempts, network errors)
 * becomes one message above the form.
 */
export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  setFormError: (message: string) => void,
): void {
  if (!(error instanceof ApiClientError)) {
    setFormError("通信に失敗しました。時間をおいてお試しください");
    return;
  }

  if (error.status === 422 && error.errors) {
    for (const [field, messages] of Object.entries(error.errors)) {
      setError(field as Path<T>, { message: messages[0] });
    }
    return;
  }

  setFormError(error.message);
}
