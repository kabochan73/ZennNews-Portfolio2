import { clearAuthToken, getAuthToken } from "@/lib/auth-cookie";
import { laravelFetch } from "@/lib/laravel";
import { forwardLaravelResponse } from "@/lib/laravel-response";

type Context = { params: Promise<{ path: string[] }> };

/**
 * Relays the browser's /api/* requests to the same Laravel path, adding the token
 * from the HttpOnly cookie as a Bearer token. Routes with their own handler
 * (/api/auth/*, /api/revalidate) take precedence over this catch-all.
 */
async function proxy(request: Request, { params }: Context): Promise<Response> {
  const { path } = await params;
  const { search } = new URL(request.url);
  const body = request.method === "GET" ? "" : await request.text();

  const response = await laravelFetch(
    `/${path.map(encodeURIComponent).join("/")}${search}`,
    {
      method: request.method,
      body: body === "" ? undefined : body,
      token: await getAuthToken(),
    },
  );

  // The token is expired or revoked: drop it so the user is sent to log in again.
  if (response.status === 401) {
    await clearAuthToken();
  }

  return forwardLaravelResponse(response);
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
