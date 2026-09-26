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

/** Waits for the current favorites, then starts the selection from them. */
export function TagSelector({ categories, isWelcome }: Props) {
  const { data } = useMyHome();

  if (!data) {
    return <TagSelectorSkeleton />;
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
    <div className="pb-28">
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

      <div
        className={`fixed inset-x-0 z-30 border-t border-neutral-200 bg-white p-4 lg:bottom-0 ${
          isWelcome ? "bottom-0" : "bottom-16"
        }`}
      >
        <div className="mx-auto max-w-3xl">
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
    </div>
  );
}

function TagSelectorSkeleton() {
  return (
    <div aria-hidden className="mt-8 space-y-8">
      {[0, 1, 2].map((section) => (
        <div key={section}>
          <div className="h-5 w-32 animate-pulse rounded bg-neutral-200" />
          <div className="mt-3 flex flex-wrap gap-2">
            {[0, 1, 2, 3, 4].map((chip) => (
              <div
                key={chip}
                className="h-8 w-20 animate-pulse rounded-full bg-neutral-200"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
