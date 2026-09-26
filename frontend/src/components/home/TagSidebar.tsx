"use client";

import Link from "next/link";

import type { Tag } from "@/types/api";

type Props = {
  /** Favorite tags in tag bar order; undefined while loading. */
  tags: Tag[] | undefined;
  activeSlug: string;
};

/** Favorite tags listed vertically on the left, on PC only (1024px and up). */
export function TagSidebar({ tags, activeSlug }: Props) {
  return (
    <nav
      aria-label="お気に入りタグ"
      className="hidden w-48 shrink-0 border-r border-neutral-200 py-6 pr-4 lg:block"
    >
      <p className="px-3 text-xs font-bold tracking-widest text-neutral-500">
        MY TAGS
      </p>
      {tags ? (
        <ul className="mt-3 space-y-1">
          {tags.map((tag) => {
            const active = tag.slug === activeSlug;

            return (
              <li key={tag.id}>
                <Link
                  href={`/home/${tag.slug}`}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    active
                      ? "bg-neutral-100 font-bold text-black"
                      : "text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  <span aria-hidden className={active ? "" : "invisible"}>
                    ●
                  </span>
                  {tag.name}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div aria-hidden className="mt-3 space-y-2 px-3">
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="h-5 w-24 animate-pulse rounded bg-neutral-200"
            />
          ))}
        </div>
      )}
    </nav>
  );
}
