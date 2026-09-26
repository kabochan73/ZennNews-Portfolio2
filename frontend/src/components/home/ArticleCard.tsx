"use client";

import Image from "next/image";

import { formatPublishedAt } from "@/lib/format";
import type { Article } from "@/types/api";

type Props = {
  article: Article;
  isBookmarked: boolean;
  /** Just read in this view: stays in NEW, dimmed, until the tab or tag changes. */
  faded?: boolean;
  /** Called when the article is opened on Zenn (marks it as read). */
  onOpen: (article: Article) => void;
  onToggleBookmark: (article: Article, isBookmarked: boolean) => void;
};

export function ArticleCard({
  article,
  isBookmarked,
  faded = false,
  onOpen,
  onToggleBookmark,
}: Props) {
  return (
    <article
      className={`flex gap-4 border-b border-neutral-200 px-4 py-4 transition-opacity ${
        faded ? "opacity-40" : ""
      }`}
    >
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onOpen(article)}
        className="flex min-w-0 flex-1 gap-4"
      >
        <span
          aria-hidden
          className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-3xl"
        >
          {article.emoji}
        </span>
        <span className="min-w-0">
          <span className="line-clamp-3 leading-snug font-bold">
            {article.title}
          </span>
          <span className="mt-2 flex items-center gap-2 text-xs text-neutral-500">
            {article.author.avatar_url ? (
              // Avatars come from many hosts (Google, Zenn, ...); tiny images,
              // so they are shown as is instead of going through the optimizer.
              <Image
                src={article.author.avatar_url}
                alt=""
                width={20}
                height={20}
                unoptimized
                className="size-5 rounded-full"
              />
            ) : (
              <span
                aria-hidden
                className="size-5 rounded-full bg-neutral-200"
              />
            )}
            <span className="truncate">{article.author.name}</span>
            <span aria-hidden>·</span>
            <time dateTime={article.published_at} className="shrink-0">
              {formatPublishedAt(article.published_at)}
            </time>
          </span>
        </span>
      </a>
      <button
        type="button"
        aria-pressed={isBookmarked}
        aria-label={isBookmarked ? "ブックマークを外す" : "ブックマークする"}
        onClick={() => onToggleBookmark(article, isBookmarked)}
        className="self-end p-1 text-black"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="size-5"
          fill={isBookmarked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
        >
          <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1z" />
        </svg>
      </button>
    </article>
  );
}
