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

/** Card-shaped gray placeholders while the user's data loads. */
export function ArticleListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <ul aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <li
          key={index}
          className="flex gap-4 border-b border-neutral-200 px-4 py-4"
        >
          <div className="size-16 shrink-0 animate-pulse rounded-xl bg-neutral-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-neutral-200" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-200" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-200" />
          </div>
        </li>
      ))}
    </ul>
  );
}
