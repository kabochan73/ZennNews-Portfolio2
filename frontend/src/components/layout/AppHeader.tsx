"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import {
  activeNavHref,
  isWelcomePage,
  NAV_ITEMS,
} from "@/components/layout/nav";
import { useMyHome } from "@/hooks/useMyHome";

/**
 * Header for the signed-in pages. The logo is part of the prerendered (ISR) HTML;
 * the links and username depend on the URL and the user, so they render in the
 * browser inside Suspense.
 */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/home" className="text-2xl font-bold">
          Zenn News
        </Link>
        {/* useSearchParams needs a Suspense boundary, or the static pages fail to build. */}
        <Suspense fallback={null}>
          <HeaderNav />
        </Suspense>
      </div>
    </header>
  );
}

function HeaderNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data } = useMyHome();
  const activeHref = activeNavHref(pathname);

  return (
    <div className="flex items-center gap-6">
      {!isWelcomePage(pathname, searchParams.get("welcome")) && (
        <nav className="hidden items-center gap-6 text-sm lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.href === activeHref ? "page" : undefined}
              className={
                item.href === activeHref
                  ? "font-bold text-black"
                  : "text-neutral-400 hover:text-black"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
      {data && (
        <span className="max-w-40 truncate text-sm text-neutral-600">
          {data.user.username}
        </span>
      )}
    </div>
  );
}
