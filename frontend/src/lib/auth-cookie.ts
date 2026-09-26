import "server-only";

import { cookies } from "next/headers";

/** HttpOnly cookie holding the Sanctum token; JavaScript in the browser can't read it. */
export const AUTH_COOKIE_NAME = "zennnews_token";

/** Same lifetime as the Sanctum token (1 year). */
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function getAuthToken(): Promise<string | undefined> {
  return (await cookies()).get(AUTH_COOKIE_NAME)?.value;
}

/** Only callable in Route Handlers and Server Functions. */
export async function setAuthToken(token: string): Promise<void> {
  (await cookies()).set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    // Local development runs on plain HTTP, so Secure is enabled only in production.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
}

/** Only callable in Route Handlers and Server Functions. */
export async function clearAuthToken(): Promise<void> {
  (await cookies()).delete(AUTH_COOKIE_NAME);
}
