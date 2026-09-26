import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { TagBar } from "@/components/home/TagBar";
import { TagSidebar } from "@/components/home/TagSidebar";
import type { Tag } from "@/types/api";

const tags: Tag[] = [
  { id: 3, slug: "nextjs", name: "Next.js" },
  { id: 4, slug: "laravel", name: "Laravel" },
  { id: 5, slug: "aws", name: "AWS" },
];

describe.each([
  ["TagBar", TagBar],
  ["TagSidebar", TagSidebar],
])("%s", (_, Component) => {
  test("links each favorite tag in order and marks the current one", () => {
    render(<Component tags={tags} activeSlug="laravel" />);

    const links = screen.getAllByRole("link");
    expect(
      links.map((link) => link.textContent?.replace("●", "").trim()),
    ).toEqual(["Next.js", "Laravel", "AWS"]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/home/nextjs",
      "/home/laravel",
      "/home/aws",
    ]);
    expect(links[1]).toHaveAttribute("aria-current", "page");
    expect(links[0]).not.toHaveAttribute("aria-current");
  });

  test("shows placeholders while the favorites load", () => {
    render(<Component tags={undefined} activeSlug="laravel" />);

    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});
