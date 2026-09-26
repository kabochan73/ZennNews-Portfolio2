import type { Metadata } from "next";
import { connection } from "next/server";

import { TagSelector } from "@/components/tags/TagSelector";
import { getTagCategories } from "@/lib/laravel";

export const metadata: Metadata = {
  title: "タグ設定 | Zenn News",
};

/**
 * Tag settings (/home/tags; first run: ?welcome=1).
 *
 * Rendered per request, not at build time: Laravel isn't reachable while the
 * Docker image is built. The tag list itself comes from the 1-day data cache,
 * so Laravel is still called about once a day.
 */
export default async function TagSettingsPage({
  searchParams,
}: PageProps<"/home/tags">) {
  await connection();
  const [{ welcome }, categories] = await Promise.all([
    searchParams,
    getTagCategories(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">興味のあるタグを選択</h1>
      <p className="mt-2 text-sm text-neutral-600">
        選択したタグの最新記事を、ホームで表示します。
      </p>
      <TagSelector categories={categories} isWelcome={welcome === "1"} />
    </div>
  );
}
