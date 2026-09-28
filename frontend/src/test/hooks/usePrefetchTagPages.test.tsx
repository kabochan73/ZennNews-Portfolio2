import { renderHook } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { usePrefetchTagPages } from "@/hooks/usePrefetchTagPages";
import type { Tag } from "@/types/api";

const prefetch = vi.fn();
// The same router object on every render, like Next.js.
const router = { prefetch };

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

afterEach(() => {
  vi.clearAllMocks();
});

const tags: Tag[] = [
  { id: 1, slug: "nextjs", name: "Next.js" },
  { id: 2, slug: "laravel", name: "Laravel" },
  { id: 3, slug: "aws", name: "AWS" },
];

test("prefetches every favorite tag except the current one", () => {
  renderHook(() => usePrefetchTagPages(tags, "laravel"));

  expect(prefetch.mock.calls.map(([href]) => href)).toEqual([
    "/home/nextjs",
    "/home/aws",
  ]);
});

test("does not prefetch again for the same tags in a new array", () => {
  const { rerender } = renderHook(
    ({ favorites }) => usePrefetchTagPages(favorites, "laravel"),
    { initialProps: { favorites: tags } },
  );

  rerender({ favorites: [...tags] });

  expect(prefetch).toHaveBeenCalledTimes(2);
});

test("prefetches nothing without favorites", () => {
  renderHook(() => usePrefetchTagPages([], "laravel"));

  expect(prefetch).not.toHaveBeenCalled();
});
