"use client";

import { useSyncExternalStore } from "react";

import { LOGGED_IN_COOKIE_NAME } from "@/lib/cookie-names";

function hasLoggedInCookie(): boolean {
  return document.cookie
    .split("; ")
    .some((cookie) => cookie.startsWith(`${LOGGED_IN_COOKIE_NAME}=`));
}

/** Cookies don't notify changes; login and logout reload the page anyway. */
function subscribe(): () => void {
  return () => {};
}

/**
 * Whether the logged-in hint cookie exists, for switching the display of static
 * (SSG) pages after they load. Always false while rendering on the server, so the
 * prerendered HTML is the logged-out version for everyone.
 */
export function useIsLoggedIn(): boolean {
  return useSyncExternalStore(subscribe, hasLoggedInCookie, () => false);
}
