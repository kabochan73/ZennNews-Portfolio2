import "server-only";

import type { ApiError } from "@/types/api";

/**
 * Error response for the browser: only message / errors (never debug details such as
 * a stack trace), keeping the status and Retry-After.
 */
export async function laravelErrorResponse(
  response: Response,
): Promise<Response> {
  const { message, errors }: ApiError = await response.json();

  const headers = new Headers();
  const retryAfter = response.headers.get("Retry-After");
  if (retryAfter) {
    headers.set("Retry-After", retryAfter);
  }

  return Response.json(errors ? { message, errors } : { message }, {
    status: response.status,
    headers,
  });
}

/** Pass a Laravel response on to the browser. */
export async function forwardLaravelResponse(
  response: Response,
): Promise<Response> {
  if (!response.ok) {
    return laravelErrorResponse(response);
  }
  if (response.status === 204) {
    return new Response(null, { status: 204 });
  }

  return Response.json(await response.json(), { status: response.status });
}
