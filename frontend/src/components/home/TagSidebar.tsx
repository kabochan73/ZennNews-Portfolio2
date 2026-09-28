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
      className="hidden w-48 shrink-0 border-r border-neutral-400 pr-4 lg:block"
    >
      {/* The inner box sticks under the header, so the border line still runs the full height. */}
      <div className="sticky top-14 max-h-[calc(100dvh-3.5rem)] overflow-y-auto py-6">
        <p className="px-3 text-xl font-bold tracking-widest text-neutral-800">
          MY TAGS
        </p>
        {tags && (
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
        )}
      </div>
    </nav>
  );
}
