"use client"; // Error boundaries must be Client Components.

import Link from "next/link";
import { useEffect } from "react";

/** Shown when rendering fails unexpectedly (500). */
export default function ErrorPage({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="px-4 py-24 text-center">
      <h1 className="text-lg font-bold">エラーが発生しました</h1>
      <div className="mt-8">
        <Link
          href="/"
          className="rounded-full bg-black px-6 py-2.5 text-sm text-white hover:bg-neutral-800"
        >
          トップへ
        </Link>
      </div>
    </main>
  );
}
