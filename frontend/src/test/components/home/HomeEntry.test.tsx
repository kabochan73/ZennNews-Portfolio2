import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { HomeEntry } from "@/components/home/HomeEntry";
import type { MyHome } from "@/types/api";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function myHome(slugs: string[]): MyHome {
  return {
    user: { username: "takumi", created_at: null },
    favorite_tags: slugs.map((slug, index) => ({
      id: index + 1,
      slug,
      name: slug,
    })),
    read_article_ids: [],
    bookmarks: [],
  };
}

function renderEntry() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <HomeEntry />
    </QueryClientProvider>,
  );
}

test("shows the home skeleton while loading", () => {
  fetchMock.mockReturnValue(new Promise(() => {}));
  renderEntry();

  expect(screen.getAllByRole("tab")).toHaveLength(3);
  expect(replace).not.toHaveBeenCalled();
});

test("moves to the leftmost favorite tag", async () => {
  fetchMock.mockResolvedValue(Response.json(myHome(["laravel", "nextjs"])));
  renderEntry();

  await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/home/laravel"));
  expect(fetchMock.mock.calls[0][0]).toBe("/api/me/home");
});

test("without favorites, moves to the first-run tag settings", async () => {
  fetchMock.mockResolvedValue(Response.json(myHome([])));
  renderEntry();

  await vi.waitFor(() =>
    expect(replace).toHaveBeenCalledWith("/home/tags?welcome=1"),
  );
});

test("on failure, offers to reload", async () => {
  fetchMock.mockResolvedValueOnce(
    Response.json({ message: "Server Error" }, { status: 500 }),
  );
  renderEntry();

  expect(
    await screen.findByText("記事を読み込めませんでした"),
  ).toBeInTheDocument();

  fetchMock.mockResolvedValueOnce(Response.json(myHome(["nextjs"])));
  await userEvent.click(screen.getByRole("button", { name: "再読み込み" }));

  await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/home/nextjs"));
});
