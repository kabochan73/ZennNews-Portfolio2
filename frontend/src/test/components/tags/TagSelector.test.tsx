import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { TagSelector } from "@/components/tags/TagSelector";
import { ToastProvider } from "@/components/ui/Toast";
import { MY_HOME_QUERY_KEY } from "@/hooks/useMyHome";
import type { MyHome, TagCategory } from "@/types/api";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const fetchMock = vi.fn();

const categories: TagCategory[] = [
  {
    name: "開発言語",
    tags: [
      { id: 1, slug: "typescript", name: "TypeScript" },
      { id: 2, slug: "php", name: "PHP" },
    ],
  },
  {
    name: "フレームワーク・ライブラリ",
    tags: [
      { id: 3, slug: "nextjs", name: "Next.js" },
      { id: 4, slug: "laravel", name: "Laravel" },
    ],
  },
];

const myHome: MyHome = {
  user: { username: "takumi", created_at: null },
  favorite_tags: [{ id: 3, slug: "nextjs", name: "Next.js" }],
  read_article_ids: [],
  bookmarks: [],
};

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function renderSelector(home: MyHome = myHome) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity } },
  });
  queryClient.setQueryData(MY_HOME_QUERY_KEY, home);
  render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <TagSelector categories={categories} isWelcome={false} />
      </ToastProvider>
    </QueryClientProvider>,
  );

  return { queryClient };
}

const tagButton = (name: string) => screen.getByRole("button", { name });
const saveButton = () => screen.getByRole("button", { name: "保存する" });

test("starts from the current favorites with per-category counts", () => {
  renderSelector();

  expect(tagButton("Next.js")).toHaveAttribute("aria-pressed", "true");
  expect(tagButton("PHP")).toHaveAttribute("aria-pressed", "false");
  const frameworks = screen
    .getByRole("heading", { name: "フレームワーク・ライブラリ" })
    .closest("section")!;
  expect(within(frameworks).getByText("1/2 選択中")).toBeInTheDocument();
  const languages = screen
    .getByRole("heading", { name: "開発言語" })
    .closest("section")!;
  expect(within(languages).getByText("0/2 選択中")).toBeInTheDocument();
});

test("saves in the order tapped; re-selecting moves a tag to the end", async () => {
  const user = userEvent.setup();
  fetchMock.mockResolvedValue(
    Response.json({
      tags: [
        { id: 1, slug: "typescript", name: "TypeScript" },
        { id: 3, slug: "nextjs", name: "Next.js" },
      ],
    }),
  );
  const { queryClient } = renderSelector();

  await user.click(tagButton("TypeScript")); // [3, 1]
  await user.click(tagButton("PHP")); // [3, 1, 2]
  await user.click(tagButton("PHP")); // [3, 1]
  await user.click(tagButton("Next.js")); // [1]
  await user.click(tagButton("Next.js")); // [1, 3]
  await user.click(saveButton());

  await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/home"));
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe("/api/me/tags");
  expect(init.method).toBe("PUT");
  expect(JSON.parse(init.body)).toEqual({ tag_ids: [1, 3] });
  expect(
    queryClient
      .getQueryData<MyHome>(MY_HOME_QUERY_KEY)
      ?.favorite_tags.map((tag) => tag.id),
  ).toEqual([1, 3]);
});

test("cannot save with no tag selected", async () => {
  const user = userEvent.setup();
  renderSelector();

  await user.click(tagButton("Next.js"));

  expect(saveButton()).toBeDisabled();
});

test("shows a toast when saving fails", async () => {
  const user = userEvent.setup();
  fetchMock.mockResolvedValue(
    Response.json({ message: "Server Error" }, { status: 500 }),
  );
  renderSelector();

  await user.click(saveButton());

  expect(await screen.findByText("保存に失敗しました")).toBeInTheDocument();
  expect(push).not.toHaveBeenCalled();
});
