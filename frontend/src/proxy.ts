import { type NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

/**
 * Sends visitors without the auth cookie from /home/* to /login.
 *
 * This is only an optimistic check (does the cookie exist?). Whether the token is
 * valid is decided by Laravel; a 401 from /api/* clears the cookie and the page
 * sends the user to /login. Asking Laravel here would cost a request per page view.
 */
export function proxy(request: NextRequest): NextResponse {
  if (!request.cookies.has(AUTH_COOKIE_NAME)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/home/:path*",
};
