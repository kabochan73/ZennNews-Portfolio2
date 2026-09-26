import { render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { StartButtons } from "@/components/top/StartButtons";
import { LOGGED_IN_COOKIE_NAME } from "@/lib/cookie-names";

afterEach(() => {
  document.cookie = `${LOGGED_IN_COOKIE_NAME}=; max-age=0`;
});

test("logged out: はじめる leads to register, with an optional login button", () => {
  render(<StartButtons withLogin />);

  expect(screen.getByRole("link", { name: /はじめる/ })).toHaveAttribute(
    "href",
    "/register",
  );
  expect(screen.getByRole("link", { name: "ログイン" })).toHaveAttribute(
    "href",
    "/login",
  );
});

test("without withLogin, only はじめる is shown", () => {
  render(<StartButtons />);

  expect(
    screen.queryByRole("link", { name: "ログイン" }),
  ).not.toBeInTheDocument();
});

test("logged in: a single ホームへ button leads to /home", () => {
  document.cookie = `${LOGGED_IN_COOKIE_NAME}=1`;

  render(<StartButtons withLogin />);

  expect(screen.getByRole("link", { name: /ホームへ/ })).toHaveAttribute(
    "href",
    "/home",
  );
  expect(
    screen.queryByRole("link", { name: /はじめる/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "ログイン" }),
  ).not.toBeInTheDocument();
});
