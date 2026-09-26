"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import type { Tag } from "@/types/api";

type Props = {
  /** Favorite tags in tag bar order; undefined while loading. */
  tags: Tag[] | undefined;
  activeSlug: string;
};

/** Favorite tags in one horizontally scrolling row, on mobile only. */
export function TagBar({ tags, activeSlug }: Props) {
  const activeRef = useRef<HTMLAnchorElement>(null);

  // Bring the current tag into view when it is off screen.
  useEffect(() => {
    activeRef.current?.scrollIntoView?.({ inline: "center", block: "nearest" });
  }, [activeSlug, tags]);

  return (
    <nav
      aria-label="お気に入りタグ"
      className="relative border-b border-neutral-200 lg:hidden"
    >
      {tags ? (
        <ul className="flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 py-3">
          {tags.map((tag) => {
            const active = tag.slug === activeSlug;

            return (
              <li key={tag.id} className="shrink-0">
                <Link
                  ref={active ? activeRef : undefined}
                  href={`/home/${tag.slug}`}
                  aria-current={active ? "page" : undefined}
                  className={`block rounded-full border px-4 py-1.5 text-sm ${
                    active
                      ? "border-black bg-black text-white"
                      : "border-neutral-300 bg-white"
                  }`}
                >
                  {tag.name}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div aria-hidden className="flex gap-2 px-4 py-3">
          {[0, 1, 2, 3].map((chip) => (
            <div
              key={chip}
              className="h-8 w-20 shrink-0 animate-pulse rounded-full bg-neutral-200"
            />
          ))}
        </div>
      )}
      {/* Fade on the right edge: hints that the row continues. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white"
      />
    </nav>
  );
}
