"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/components/ui/Toast";
import { updateMyHomeCache } from "@/hooks/useMyHome";
import { ApiClientError, apiFetch } from "@/lib/api-client";
import type { Article, MyHome } from "@/types/api";

type ToggleBookmark = {
  article: Article;
  /** Whether it is bookmarked now (before the toggle). */
  isBookmarked: boolean;
};

function addBookmark(home: MyHome, article: Article): MyHome {
  return home.bookmarks.some((bookmark) => bookmark.id === article.id)
    ? home
    : { ...home, bookmarks: [article, ...home.bookmarks] }; // newest first
}

function removeBookmark(home: MyHome, articleId: number): MyHome {
  return {
    ...home,
    bookmarks: home.bookmarks.filter((bookmark) => bookmark.id !== articleId),
  };
}

/**
 * Bookmark / unbookmark an article (PUT or DELETE /api/articles/{id}/bookmark),
 * optimistically; on failure only this article is reverted.
 */
export function useToggleBookmark() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const mutation = useMutation({
    mutationFn: ({ article, isBookmarked }: ToggleBookmark) =>
      apiFetch(`/articles/${article.id}/bookmark`, {
        method: isBookmarked ? "DELETE" : "PUT",
      }),
    onMutate: ({ article, isBookmarked }) => {
      updateMyHomeCache(queryClient, (home) =>
        isBookmarked
          ? removeBookmark(home, article.id)
          : addBookmark(home, article),
      );
    },
    onError: (error, { article, isBookmarked }) => {
      // Revert only this article, keeping other changes made in the meantime.
      updateMyHomeCache(queryClient, (home) =>
        isBookmarked
          ? addBookmark(home, article)
          : removeBookmark(home, article.id),
      );

      if (error instanceof ApiClientError && error.status === 401) {
        return; // handled globally (redirect to the login page)
      }
      // 422 is the 100-bookmark limit; show Laravel's message as is.
      showToast(
        error instanceof ApiClientError && error.status === 422
          ? error.message
          : "保存に失敗しました",
      );
    },
  });

  return mutation.mutate;
}
