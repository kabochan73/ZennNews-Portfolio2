import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { ToastProvider } from "@/components/ui/Toast";
import { useMarkAsRead } from "@/hooks/useMarkAsRead";
import { MY_HOME_QUERY_KEY, updateMyHomeCache } from "@/hooks/useMyHome";
import type { MyHome } from "@/types/api";

const fetchMock = vi.fn();
let queryClient: QueryClient;

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity } },
  });
  queryClient.setQueryData<MyHome>(MY_HOME_QUERY_KEY, {
    user: { username: "takumi", created_at: null },
    favorite_tags: [],
    read_article_ids: [1],
    bookmarks: [],
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

const readIds = () =>
  queryClient.getQueryData<MyHome>(MY_HOME_QUERY_KEY)?.read_article_ids;

test("adds the ID at once, before the API answers", async () => {
  let respond!: (response: Response) => void;
  fetchMock.mockReturnValue(new Promise((resolve) => (respond = resolve)));
  const { result } = renderHook(() => useMarkAsRead(), { wrapper });

  act(() => result.current(2));

  await vi.waitFor(() => expect(readIds()).toEqual([1, 2]));
  expect(fetchMock.mock.calls[0][0]).toBe("/api/articles/2/read");
  expect(fetchMock.mock.calls[0][1].method).toBe("POST");

  respond(new Response(null, { status: 204 }));
  await vi.waitFor(() => expect(readIds()).toEqual([1, 2]));
});

test("does not duplicate an already read article", async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
  const { result } = renderHook(() => useMarkAsRead(), { wrapper });

  act(() => result.current(1));

  await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
  expect(readIds()).toEqual([1]);
});

test("on failure, reverts only this article and shows a toast", async () => {
  let respond!: (response: Response) => void;
  fetchMock.mockReturnValue(new Promise((resolve) => (respond = resolve)));
  const { result } = renderHook(() => useMarkAsRead(), { wrapper });

  act(() => result.current(2));
  await vi.waitFor(() => expect(readIds()).toEqual([1, 2]));
  // Another article is read while the request is still pending.
  act(() =>
    updateMyHomeCache(queryClient, (home) => ({
      ...home,
      read_article_ids: [...home.read_article_ids, 3],
    })),
  );

  respond(Response.json({ message: "Server Error" }, { status: 500 }));

  await vi.waitFor(() => expect(readIds()).toEqual([1, 3]));
  expect(await screen.findByText("保存に失敗しました")).toBeInTheDocument();
});

test("a failure for an article that was already read keeps it read", async () => {
  fetchMock.mockResolvedValue(
    Response.json({ message: "Server Error" }, { status: 500 }),
  );
  const { result } = renderHook(() => useMarkAsRead(), { wrapper });

  act(() => result.current(1));

  expect(await screen.findByText("保存に失敗しました")).toBeInTheDocument();
  expect(readIds()).toEqual([1]);
});
