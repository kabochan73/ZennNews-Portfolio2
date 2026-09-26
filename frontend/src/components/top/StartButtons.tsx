"use client";

import Link from "next/link";

import { useIsLoggedIn } from "@/hooks/useIsLoggedIn";

type Props = {
  /** Also show a "ログイン" button next to "はじめる" (hero only). */
  withLogin?: boolean;
  /** "dark" for buttons on a black background. */
  tone?: "light" | "dark";
};

/**
 * Call-to-action buttons of the top page. The static HTML has the logged-out
 * version; a logged-in visitor sees "ホームへ" once the page has loaded.
 */
export function StartButtons({ withLogin = false, tone = "light" }: Props) {
  const isLoggedIn = useIsLoggedIn();
  const primary =
    tone === "light"
      ? "bg-black text-white hover:bg-neutral-800"
      : "bg-white text-black hover:bg-neutral-200";

  if (isLoggedIn) {
    return (
      <Link href="/home" className={`${BUTTON} ${primary}`}>
        ホームへ →
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Link href="/register" className={`${BUTTON} ${primary}`}>
        はじめる →
      </Link>
      {withLogin && (
        <Link
          href="/login"
          className={`${BUTTON} border border-neutral-300 hover:bg-neutral-100`}
        >
          ログイン
        </Link>
      )}
    </div>
  );
}

const BUTTON = "inline-block rounded-full px-7 py-3 text-sm font-bold";
