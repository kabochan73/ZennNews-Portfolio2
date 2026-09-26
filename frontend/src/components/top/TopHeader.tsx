"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { useIsLoggedIn } from "@/hooks/useIsLoggedIn";

/**
 * Header of the static top page: the public header in the prerendered HTML,
 * switched to the signed-in header in the browser when the hint cookie exists.
 */
export function TopHeader() {
  return useIsLoggedIn() ? <AppHeader /> : <PublicHeader />;
}
