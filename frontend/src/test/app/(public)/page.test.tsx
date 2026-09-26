import { render, screen, within } from "@testing-library/react";
import { expect, test } from "vitest";

import TopPage from "@/app/(public)/page";

test("shows the hero, the four features and the comparison with Zenn", () => {
  render(<TopPage />);

  expect(
    screen.getByRole("heading", { level: 1, name: /もっと効率よく追いかける/ }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "このアプリでできること" }),
  ).toBeInTheDocument();
  expect(
    screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent),
  ).toEqual([
    "タグを選ぶ",
    "新しい順でチェック",
    "NEW / READ で既読管理",
    "あとで読む",
  ]);
  expect(screen.getByText(/最大100件まで保存できる/)).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Zennとの違い" }),
  ).toBeInTheDocument();
});

test("logged out, the buttons lead to register and login", () => {
  render(<TopPage />);

  const header = screen.getByRole("banner");
  expect(
    within(header).getByRole("link", { name: "新規登録" }),
  ).toHaveAttribute("href", "/register");
  expect(
    within(header).getByRole("link", { name: "ログイン" }),
  ).toHaveAttribute("href", "/login");

  const startLinks = screen.getAllByRole("link", { name: /はじめる/ });
  expect(startLinks).toHaveLength(2);
  startLinks.forEach((link) =>
    expect(link).toHaveAttribute("href", "/register"),
  );
  expect(
    screen.queryByRole("link", { name: /ホームへ/ }),
  ).not.toBeInTheDocument();
});
