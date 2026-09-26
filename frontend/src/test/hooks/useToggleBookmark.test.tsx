import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { ToastProvider } from "@/components/ui/Toast";
import { MY_HOME_QUERY_KEY } from "@/hooks/useMyHome";
import { useToggleBookmark } from "@/hooks/useToggleBookmark";
import type { Article, MyHome } from "@/types/api";

function article(id: number): Article {
  return {
    id,
    title: `Article ${id}`,
    emoji: "🚀",
    article_type: "tech",
    url: `https://zenn.dev/a/articles/${id}`,
    author: { username: "a", name: "A", avatar_url: null },
    published_at: "2026-09-23T14:05:00+09:00",
  };
}

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
    read_article_ids: [],
    bookmarks: [article(1)],
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

const bookmarkIds = () =>
  queryClient
    .getQueryData<MyHome>(MY_HOME_QUERY_KEY)
    ?.bookmarks.map((bookmark) => bookmark.id);

test("bookmarking puts the article first at once with a PUT", async () => {
  fetchMock.mockReturnValue(new Promise(() => {})); // never answers
  const { result } = renderHook(() => useToggleBookmark(), { wrapper });

  act(() => result.current({ article: article(2), isBookmarked: false }));

  await vi.waitFor(() => expect(bookmarkIds()).toEqual([2, 1]));
  expect(fetchMock.mock.calls[0][0]).toBe("/api/articles/2/bookmark");
  expect(fetchMock.mock.calls[0][1].method).toBe("PUT");
});

test("unbookmarking removes the article at once with a DELETE", async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
  const { result } = renderHook(() => useToggleBookmark(), { wrapper });

  act(() => result.current({ article: article(1), isBookmarked: true }));

  await vi.waitFor(() => expect(bookmarkIds()).toEqual([]));
  expect(fetchMock.mock.calls[0][1].method).toBe("DELETE");
});

test("at the limit, reverts and shows Laravel's message", async () => {
  fetchMock.mockResolvedValue(
    Response.json(
      { message: "ブックマークは100件までです。いくつか外してください" },
      { status: 422 },
    ),
  );
  const { result } = renderHook(() => useToggleBookmark(), { wrapper });

  act(() => result.current({ article: article(2), isBookmarked: false }));

  expect(
    await screen.findByText(
      "ブックマークは100件までです。いくつか外してください",
    ),
  ).toBeInTheDocument();
  expect(bookmarkIds()).toEqual([1]);
});

test("a failed unbookmark puts the article back and shows a toast", async () => {
  fetchMock.mockResolvedValue(
    Response.json({ message: "Server Error" }, { status: 500 }),
  );
  const { result } = renderHook(() => useToggleBookmark(), { wrapper });

  act(() => result.current({ article: article(1), isBookmarked: true }));

  expect(await screen.findByText("保存に失敗しました")).toBeInTheDocument();
  expect(bookmarkIds()).toEqual([1]);
});
