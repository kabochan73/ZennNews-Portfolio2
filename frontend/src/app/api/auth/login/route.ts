import { handleAuthRequest } from "@/lib/auth-route";

/** Log in; the token is stored in the HttpOnly cookie. */
export async function POST(request: Request): Promise<Response> {
  return handleAuthRequest(request, "/login");
}
