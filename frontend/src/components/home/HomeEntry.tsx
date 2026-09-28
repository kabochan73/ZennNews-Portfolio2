"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useMyHome } from "@/hooks/useMyHome";

/**
 * /home: fetches the user's data and moves to the leftmost favorite tag, or to
 * the first-run tag settings when there is none. The fetched data stays in the
 * query cache, so the tag page shows NEW / READ without another request.
 */
export function HomeEntry() {
  const router = useRouter();
  const { data, isError, refetch } = useMyHome();

  useEffect(() => {
    if (!data) {
      return;
    }
    const [firstTag] = data.favorite_tags;
    // replace, so the browser's back button doesn't land on this entry again.
    router.replace(
      firstTag ? `/home/${firstTag.slug}` : "/home/tags?welcome=1",
    );
  }, [data, router]);

  if (isError) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-sm text-neutral-600">記事を読み込めませんでした</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 rounded-full border border-neutral-300 px-5 py-2 text-sm hover:bg-neutral-100"
        >
          再読み込み
        </button>
      </div>
    );
  }

  // Nothing to show while loading and moving on.
  return null;
}
