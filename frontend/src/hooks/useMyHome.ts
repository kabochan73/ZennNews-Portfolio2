"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import type { MyHome } from "@/types/api";

export const MY_HOME_QUERY_KEY = ["me", "home"] as const;

/**
 * The signed-in user's data for the home screen (GET /api/me/home): username,
 * favorite tags, read article IDs and bookmarks. Fetched once and shared by
 * every component through the query cache.
 */
export function useMyHome() {
  return useQuery({
    queryKey: MY_HOME_QUERY_KEY,
    queryFn: () => apiFetch<MyHome>("/me/home"),
  });
}
