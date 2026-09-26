import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { HomeFeed } from "@/components/home/HomeFeed";
import { ToastProvider } from "@/components/ui/Toast";
import { MY_HOME_QUERY_KEY } from "@/hooks/useMyHome";
import type { Article, MyHome, Tag } from "@/types/api";

function article(id: number, title: string): Article {
  return {
    id,
    title,
    emoji: "🚀",
    article_type: "tech",
    url: `https://zenn.dev/a/articles/${id}`,
    author: { username: "a", name: "A", avatar_url: null },
    published_at: "2026-09-23T14:05:00+09:00",
  };
}

const nextjs: Tag = { id: 3, slug: "nextjs", name: "Next.js" };
const articles = [
  article(1, "Unread one"),
  article(2, "Unread two"),
  article(3, "Already read"),
];
const myHome: MyHome = {
  user: { username: "takumi", created_at: null },
  favorite_tags: [nextjs],
  read_article_ids: [3],
  bookmarks: [article(9, "Bookmarked elsewhere")],
};

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function renderFeed({
  home = myHome,
  tagArticles = articles,
}: { home?: MyHome | null; tagArticles?: Article[] } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  if (home) {
    queryClient.setQueryData(MY_HOME_QUERY_KEY, home);
  } else {
    fetchMock.mockReturnValue(new Promise(() => {})); // /api/me/home never answers
  }
  render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <HomeFeed tag={nextjs} articles={tagArticles} />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

const tab = (name: RegExp) => screen.getByRole("tab", { name });
const titles = () =>
  screen
    .queryAllByRole("article")
    .map((card) => within(card).getByRole("link").textContent);

test("shows placeholders until the user's reads have loaded", () => {
  renderFeed({ home: null });

  expect(screen.queryAllByRole("article")).toHaveLength(0);
  expect(tab(/NEW/)).toHaveTextContent(/^NEW$/);
});

test("splits the tag's articles into NEW and READ, and lists bookmarks", async () => {
  const user = userEvent.setup();
  renderFeed();

  expect(tab(/NEW/)).toHaveTextContent("NEW2");
  expect(tab(/READ/)).toHaveTextContent("READ1");
  expect(tab(/BOOKMARK/)).toHaveTextContent("BOOKMARK1");
  expect(titles()).toEqual([
    expect.stringContaining("Unread one"),
    expect.stringContaining("Unread two"),
  ]);

  await user.click(tab(/READ/));
  expect(titles()).toEqual([expect.stringContaining("Already read")]);

  await user.click(tab(/BOOKMARK/));
  expect(titles()).toEqual([expect.stringContaining("Bookmarked elsewhere")]);
});

test("a just-read article stays in NEW dimmed until the tab changes", async () => {
  const user = userEvent.setup();
  renderFeed();

  await user.click(screen.getByRole("link", { name: /Unread one/ }));

  expect(fetchMock).toHaveBeenCalledWith(
    "/api/articles/1/read",
    expect.objectContaining({ method: "POST" }),
  );
  const [first] = screen.getAllByRole("article");
  expect(first).toHaveTextContent("Unread one");
  expect(first).toHaveClass("opacity-40");
  expect(tab(/NEW/)).toHaveTextContent("NEW2");

  await user.click(tab(/READ/));
  await user.click(tab(/NEW/));

  expect(titles()).toEqual([expect.stringContaining("Unread two")]);
  expect(tab(/NEW/)).toHaveTextContent("NEW1");
  expect(tab(/READ/)).toHaveTextContent("READ2");
});

test("opening an already read article does not call the API", async () => {
  const user = userEvent.setup();
  renderFeed();

  await user.click(tab(/READ/));
  await user.click(screen.getByRole("link", { name: /Already read/ }));

  expect(fetchMock).not.toHaveBeenCalled();
});

test("a tag without articles yet says they are being prepared", () => {
  renderFeed({ tagArticles: [] });

  expect(
    screen.getByText("記事を準備中です。記事は毎朝3〜8時に更新されます"),
  ).toBeInTheDocument();
});
