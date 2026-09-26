import type { ApiError } from "@/types/api";

/** An error response from /api/*, with the status and Laravel's message / errors. */
export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

type ApiFetchOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
};

/**
 * Call the Next.js /api/* routes from the browser. The auth cookie is sent
 * automatically; the token itself is never visible here.
 * `path` is relative to /api, e.g. "/me/home". Resolves to undefined on 204.
 */
export async function apiFetch<T = void>(
  path: string,
  { method = "GET", body }: ApiFetchOptions = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    headers:
      body === undefined
        ? { Accept: "application/json" }
        : { Accept: "application/json", "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const { message, errors }: ApiError = await response
      .json()
      .catch(() => ({ message: "エラーが発生しました" }));

    throw new ApiClientError(response.status, message, errors);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
