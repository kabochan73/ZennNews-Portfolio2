"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/components/ui/Toast";
import { updateMyHomeCache } from "@/hooks/useMyHome";
import { ApiClientError, apiFetch } from "@/lib/api-client";

/**
 * Mark an article as read (POST /api/articles/{id}/read), optimistically: the
 * cached read IDs change at once; on failure only this article is reverted.
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const mutation = useMutation({
    mutationFn: (articleId: number) =>
      apiFetch(`/articles/${articleId}/read`, { method: "POST" }),
    onMutate: (articleId) => {
      let wasRead = false;
      updateMyHomeCache(queryClient, (home) => {
        wasRead = home.read_article_ids.includes(articleId);

        return wasRead
          ? home
          : {
              ...home,
              read_article_ids: [...home.read_article_ids, articleId],
            };
      });

      return { wasRead };
    },
    onError: (error, articleId, context) => {
      // Revert only this article (and only if this call marked it), keeping
      // other changes made in the meantime.
      if (context && !context.wasRead) {
        updateMyHomeCache(queryClient, (home) => ({
          ...home,
          read_article_ids: home.read_article_ids.filter(
            (id) => id !== articleId,
          ),
        }));
      }
      // A 401 is handled globally (redirect to the login page).
      if (!(error instanceof ApiClientError && error.status === 401)) {
        showToast("保存に失敗しました");
      }
    },
  });

  return mutation.mutate;
}
