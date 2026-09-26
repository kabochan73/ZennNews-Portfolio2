import "server-only";

import { setAuthToken } from "@/lib/auth-cookie";
import { laravelFetch } from "@/lib/laravel";
import { laravelErrorResponse } from "@/lib/laravel-response";
import type { User } from "@/types/api";

type AuthSuccess = { user: User; token: string };

/**
 * Shared by POST /api/auth/login and /api/auth/register.
 *
 * Forwards the credentials to Laravel. On success the token is stored in the HttpOnly
 * cookie and only the user is returned, so the token never reaches the browser.
 * Errors (401 / 422 / 429) are passed through with their status.
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
    return laravelErrorResponse(response);
  }

  const { user, token }: AuthSuccess = await response.json();
  await setAuthToken(token);

  return Response.json({ user }, { status: response.status });
}
