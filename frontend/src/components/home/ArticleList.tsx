"use client";

import { ArticleCard } from "@/components/home/ArticleCard";
import type { Article } from "@/types/api";

type Props = {
  articles: Article[];
  bookmarkedIds: ReadonlySet<number>;
  /** Articles read during this view; shown dimmed. */
  fadedIds?: ReadonlySet<number>;
  /** Shown when there is no article, e.g. "新着記事はありません". */
  emptyMessage: string;
  onOpen: (article: Article) => void;
  onToggleBookmark: (article: Article, isBookmarked: boolean) => void;
};

export function ArticleList({
  articles,
  bookmarkedIds,
  fadedIds,
  emptyMessage,
  onOpen,
  onToggleBookmark,
}: Props) {
  if (articles.length === 0) {
    return (
      <p className="px-4 py-16 text-center text-sm text-neutral-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul>
      {articles.map((article) => (
        <li key={article.id}>
          <ArticleCard
            article={article}
            isBookmarked={bookmarkedIds.has(article.id)}
            faded={fadedIds?.has(article.id)}
            onOpen={onOpen}
            onToggleBookmark={onToggleBookmark}
          />
        </li>
      ))}
    </ul>
  );
}
