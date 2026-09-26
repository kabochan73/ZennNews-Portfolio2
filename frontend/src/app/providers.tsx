"use client";

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import type { ReactNode } from "react";

import { ToastProvider } from "@/components/ui/Toast";
import { ApiClientError } from "@/lib/api-client";

/**
 * The cached user state (reads, bookmarks, favorite tags) only changes through this
 * user's own actions, which update the cache directly, so it never goes stale by
 * itself. A page reload fetches it again (e.g. to pick up reads from another device).
 */
const STALE_TIME_MS = Infinity;

/**
 * The login expired or was revoked: send the user to log in again.
 * A full page load (not router.push) on purpose, so the previous user's cached data
 * (reads, bookmarks) is discarded together with the in-memory query cache.
 */
function handleError(error: Error): void {
  if (error instanceof ApiClientError && error.status === 401) {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login?expired=1");
  }
}

function makeQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({ onError: handleError }),
    mutationCache: new MutationCache({ onError: handleError }),
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        refetchOnWindowFocus: false,
        // 4xx answers won't change on a retry; other failures get one more try.
        retry: (failureCount, error) =>
          !(error instanceof ApiClientError && error.status < 500) &&
          failureCount < 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient(): QueryClient {
  // Keep server renders isolated and reuse one client (and its cache) in the browser.
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  browserQueryClient ??= makeQueryClient();

  return browserQueryClient;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}
