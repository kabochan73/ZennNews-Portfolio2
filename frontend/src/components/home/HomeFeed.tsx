"use client";

import { useState } from "react";

import { ArticleList } from "@/components/home/ArticleList";
import { type HomeTab, HomeTabs } from "@/components/home/HomeTabs";
import { TagBar } from "@/components/home/TagBar";
import { TagSidebar } from "@/components/home/TagSidebar";
import { useMarkAsRead } from "@/hooks/useMarkAsRead";
import { useMyHome } from "@/hooks/useMyHome";
import { usePrefetchTagPages } from "@/hooks/usePrefetchTagPages";
import { useToggleBookmark } from "@/hooks/useToggleBookmark";
import type { Article, MyHome, Tag } from "@/types/api";

type Props = {
  tag: Tag;
  /** The tag's articles from the ISR page (shared by every user). */
  articles: Article[];
};

/** Keeps the tag bar (mobile) and the tabs under the header while scrolling. */
const STICKY_BAR = "sticky top-14 z-30 bg-white";

const EMPTY_MESSAGES: Record<HomeTab, string> = {
  new: "新着記事はありません",
  read: "まだ読んだ記事はありません",
  bookmark: "ブックマークした記事はありません。🔖 を押すと、ここに保存されます",
};

/**
 * The home screen of one tag. The articles are shared (ISR); the user's reads
 * and bookmarks come from useMyHome() and are combined here in the browser.
 */
export function HomeFeed({ tag, articles }: Props) {
  const { data: home } = useMyHome();

  return (
    <div className="mx-auto flex max-w-5xl">
      <TagSidebar tags={home?.favorite_tags} activeSlug={tag.slug} />
      <div className="min-w-0 flex-1">
        {home ? (
          <TagArticles articles={articles} home={home} tag={tag} />
        ) : (
          // Until the reads arrive, NEW can't be told apart from READ, so no articles yet.
          <div className={STICKY_BAR}>
            <TagBar tags={undefined} activeSlug={tag.slug} />
            <HomeTabs activeTab="new" counts={undefined} onChange={() => {}} />
          </div>
        )}
      </div>
    </div>
  );
}

function TagArticles({
  articles,
  home,
  tag,
}: {
  articles: Article[];
  home: MyHome;
  tag: Tag;
}) {
  const [activeTab, setActiveTab] = useState<HomeTab>("new");
  // Read IDs as of when the current tab was opened. NEW / READ and their counts
  // use this snapshot, so an article read now stays in NEW (dimmed) until the tab
  // or tag changes.
  const [readAtOpen, setReadAtOpen] = useState(
    () => new Set(home.read_article_ids),
  );
  const markAsRead = useMarkAsRead();
  usePrefetchTagPages(home.favorite_tags, tag.slug);
  const toggleBookmark = useToggleBookmark();

  const readIds = new Set(home.read_article_ids);
  const bookmarkedIds = new Set(home.bookmarks.map((article) => article.id));
  const lists: Record<HomeTab, Article[]> = {
    new: articles.filter((article) => !readAtOpen.has(article.id)),
    read: articles.filter((article) => readAtOpen.has(article.id)),
    bookmark: home.bookmarks,
  };

  function changeTab(tab: HomeTab): void {
    setActiveTab(tab);
    setReadAtOpen(new Set(home.read_article_ids));
  }

  function open(article: Article): void {
    if (!readIds.has(article.id)) {
      markAsRead(article.id);
    }
  }

  const noArticlesYet = articles.length === 0 && activeTab !== "bookmark";

  return (
    <>
      <div className={STICKY_BAR}>
        <TagBar tags={home.favorite_tags} activeSlug={tag.slug} />
        <HomeTabs
          activeTab={activeTab}
          counts={{
            new: lists.new.length,
            read: lists.read.length,
            bookmark: lists.bookmark.length,
          }}
          onChange={changeTab}
        />
      </div>
      <ArticleList
        articles={lists[activeTab]}
        bookmarkedIds={bookmarkedIds}
        fadedIds={activeTab === "new" ? readIds : undefined}
        emptyMessage={
          noArticlesYet
            ? "記事を準備中です。記事は毎朝3〜8時に更新されます"
            : EMPTY_MESSAGES[activeTab]
        }
        onOpen={open}
        onToggleBookmark={(article, isBookmarked) =>
          toggleBookmark({ article, isBookmarked })
        }
      />
    </>
  );
}
