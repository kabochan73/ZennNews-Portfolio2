import "server-only";

import { setAuthToken } from "@/lib/auth-cookie";
import { laravelFetch } from "@/lib/laravel";
import type { ApiError, User } from "@/types/api";

type AuthSuccess = { user: User; token: string };

/**
 * Shared by POST /api/auth/login and /api/auth/register.
 *
 * Forwards the credentials to Laravel. On success the token is stored in the HttpOnly
 * cookie and only the user is returned, so the token never reaches the browser.
 * Errors (401 / 422 / 429) are passed through with their status and body.
 */
export async function handleAuthRequest(
  request: Request,
  laravelPath: "/login" | "/register",
): Promise<Response> {
  const response = await laravelFetch(laravelPath, {
    method: "POST",
    body: await request.text(),
  });

  if (!response.ok) {
    const headers = new Headers();
    const retryAfter = response.headers.get("Retry-After");
    if (retryAfter) {
      headers.set("Retry-After", retryAfter);
    }

    // Pass only message / errors, never debug details such as a stack trace.
    const { message, errors }: ApiError = await response.json();

    return Response.json(errors ? { message, errors } : { message }, {
      status: response.status,
      headers,
    });
  }

  const { user, token }: AuthSuccess = await response.json();
  await setAuthToken(token);

  return Response.json({ user }, { status: response.status });
}
