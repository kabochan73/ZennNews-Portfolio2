import "server-only";

import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME, LOGGED_IN_COOKIE_NAME } from "@/lib/cookie-names";

export { AUTH_COOKIE_NAME } from "@/lib/cookie-names";

/** Same lifetime as the Sanctum token (1 year). */
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const COOKIE_OPTIONS = {
  // Local development runs on plain HTTP, so Secure is enabled only in production.
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: ONE_YEAR_SECONDS,
} as const;

export async function getAuthToken(): Promise<string | undefined> {
  return (await cookies()).get(AUTH_COOKIE_NAME)?.value;
}

/**
 * Store the token (HttpOnly; JavaScript can't read it) together with the
 * logged-in hint cookie used by static pages. Only callable in Route Handlers
 * and Server Functions.
 */
export async function setAuthToken(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    ...COOKIE_OPTIONS,
    httpOnly: true,
  });
  cookieStore.set(LOGGED_IN_COOKIE_NAME, "1", {
    ...COOKIE_OPTIONS,
    httpOnly: false,
  });
}

/** Remove the token and the hint together. Only callable in Route Handlers and Server Functions. */
export async function clearAuthToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  cookieStore.delete(LOGGED_IN_COOKIE_NAME);
}
