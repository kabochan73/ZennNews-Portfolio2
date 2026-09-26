import { handleAuthRequest } from "@/lib/auth-route";

/** Create an account; the token is stored in the HttpOnly cookie. */
export async function POST(request: Request): Promise<Response> {
  return handleAuthRequest(request, "/register");
}
