import Link from "next/link";

import { TopHeader } from "@/components/top/TopHeader";

/** 404 page, e.g. an unknown tag (/home/unknown). */
export default function NotFound() {
  return (
    <>
      <TopHeader />
      <main className="px-4 py-24 text-center">
        <p className="text-5xl font-bold">404</p>
        <h1 className="mt-4 text-lg font-bold">ページが見つかりません</h1>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/"
            className="rounded-full border border-neutral-300 px-6 py-2.5 text-sm hover:bg-neutral-100"
          >
            トップへ
          </Link>
          <Link
            href="/home"
            className="rounded-full bg-black px-6 py-2.5 text-sm text-white hover:bg-neutral-800"
          >
            ホームへ
          </Link>
        </div>
      </main>
    </>
  );
}
