"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { MY_HOME_QUERY_KEY, useMyHome } from "@/hooks/useMyHome";
import { ApiClientError, apiFetch } from "@/lib/api-client";
import type { MyHome, Tag, TagCategory } from "@/types/api";

type Props = {
  categories: TagCategory[];
  /** First run after sign-up: the bottom tabs are hidden, so the save bar sits lower. */
  isWelcome: boolean;
};

/** Waits for the current favorites (showing nothing meanwhile), then starts the selection from them. */
export function TagSelector({ categories, isWelcome }: Props) {
  const { data } = useMyHome();

  if (!data) {
    return null;
  }

  return (
    <TagSelectorForm
      categories={categories}
      isWelcome={isWelcome}
      initialIds={data.favorite_tags.map((tag) => tag.id)}
    />
  );
}

function TagSelectorForm({
  categories,
  isWelcome,
  initialIds,
}: Props & { initialIds: number[] }) {
  // Tag IDs in the order they were chosen; that order becomes the tag bar order.
  const [selectedIds, setSelectedIds] = useState<number[]>(initialIds);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const save = useMutation({
    mutationFn: (tagIds: number[]) =>
      apiFetch<{ tags: Tag[] }>("/me/tags", {
        method: "PUT",
        body: { tag_ids: tagIds },
      }),
    onSuccess: ({ tags }) => {
      // The home screen reads favorites from this cache; no refetch needed.
      queryClient.setQueryData<MyHome>(MY_HOME_QUERY_KEY, (home) =>
        home ? { ...home, favorite_tags: tags } : home,
      );
      router.push("/home");
    },
    onError: (error) => {
      // A 401 is handled globally (redirect to the login page).
      if (!(error instanceof ApiClientError && error.status === 401)) {
        showToast("保存に失敗しました");
      }
    },
  });

  /** Unselect, or append to the end (so re-selecting moves a tag to the end). */
  function toggle(tagId: number): void {
    setSelectedIds((ids) =>
      ids.includes(tagId) ? ids.filter((id) => id !== tagId) : [...ids, tagId],
    );
  }

  return (
    <div>
      {categories.map((category) => {
        const selectedCount = category.tags.filter((tag) =>
          selectedIds.includes(tag.id),
        ).length;

        return (
          <section key={category.name} className="mt-8">
            <div className="flex items-baseline justify-between">
              <h2 className="font-bold">{category.name}</h2>
              <p className="text-xs text-neutral-500">
                {selectedCount}/{category.tags.length} 選択中
              </p>
            </div>
            <ul className="mt-3 flex flex-wrap gap-2">
              {category.tags.map((tag) => {
                const selected = selectedIds.includes(tag.id);

                return (
                  <li key={tag.id}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggle(tag.id)}
                      className={`rounded-full border px-4 py-1.5 text-sm ${
                        selected
                          ? "border-black bg-black text-white"
                          : "border-neutral-300 bg-white hover:bg-neutral-100"
                      }`}
                    >
                      {selected && <span aria-hidden>✓ </span>}
                      {tag.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {/* Sticky, not fixed: it rides the bottom of the screen while scrolling, then
          stops at the end of the list instead of covering the footer. */}
      <div
        className={`sticky z-30 -mx-4 mt-8 border-t border-neutral-400 bg-white p-4 lg:bottom-0 ${
          isWelcome ? "bottom-0" : "bottom-16"
        }`}
      >
        <Button
          type="button"
          disabled={selectedIds.length === 0}
          loading={save.isPending}
          onClick={() => save.mutate(selectedIds)}
        >
          保存する
        </Button>
      </div>
    </div>
  );
}
