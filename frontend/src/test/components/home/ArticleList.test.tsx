import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

import { ArticleList } from "@/components/home/ArticleList";
import type { Article } from "@/types/api";

function article(id: number, title: string): Article {
  return {
    id,
    title,
    emoji: "🚀",
    article_type: "tech",
    url: `https://zenn.dev/sora/articles/${id}`,
    author: { username: "sora", name: "Sora", avatar_url: null },
    published_at: "2026-09-23T14:05:00+09:00",
  };
}

const articles = [
  article(1, "Next.js 16で実装するSEO最適化"),
  article(2, "React 19"),
];

function renderList(
  overrides: Partial<Parameters<typeof ArticleList>[0]> = {},
) {
  const onOpen = vi.fn();
  const onToggleBookmark = vi.fn();
  render(
    <ArticleList
      articles={articles}
      bookmarkedIds={new Set([2])}
      emptyMessage="新着記事はありません"
      onOpen={onOpen}
      onToggleBookmark={onToggleBookmark}
      {...overrides}
    />,
  );

  return { onOpen, onToggleBookmark };
}

test("shows each article with its link, author and date", () => {
  renderList();

  const link = screen.getByRole("link", {
    name: /Next.js 16で実装するSEO最適化/,
  });
  expect(link).toHaveAttribute("href", "https://zenn.dev/sora/articles/1");
  expect(link).toHaveAttribute("target", "_blank");
  expect(screen.getAllByText("Sora")).toHaveLength(2);
  expect(screen.getAllByText("9/23 14:05")).toHaveLength(2);
});

test("opening an article calls onOpen", async () => {
  const { onOpen } = renderList();

  await userEvent.click(screen.getByRole("link", { name: /React 19/ }));

  expect(onOpen).toHaveBeenCalledWith(articles[1]);
});

test("the bookmark button shows and toggles the current state", async () => {
  const { onToggleBookmark } = renderList();

  const [first, second] = screen.getAllByRole("button");
  expect(first).toHaveAttribute("aria-pressed", "false");
  expect(first).toHaveAccessibleName("ブックマークする");
  expect(second).toHaveAttribute("aria-pressed", "true");
  expect(second).toHaveAccessibleName("ブックマークを外す");

  await userEvent.click(second);
  expect(onToggleBookmark).toHaveBeenCalledWith(articles[1], true);
});

test("articles read during this view are dimmed", () => {
  renderList({ fadedIds: new Set([1]) });

  const [first, second] = screen.getAllByRole("article");
  expect(first).toHaveClass("opacity-40");
  expect(second).not.toHaveClass("opacity-40");
});

test("shows the given message when there is no article", () => {
  renderList({ articles: [] });

  expect(screen.getByText("新着記事はありません")).toBeInTheDocument();
  expect(screen.queryByRole("article")).not.toBeInTheDocument();
});
