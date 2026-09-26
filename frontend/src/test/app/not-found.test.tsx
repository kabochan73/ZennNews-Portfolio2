import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import NotFound from "@/app/not-found";

test("says the page was not found and links to the top and home", () => {
  render(<NotFound />);

  expect(
    screen.getByRole("heading", { name: "ページが見つかりません" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "トップへ" })).toHaveAttribute(
    "href",
    "/",
  );
  expect(screen.getByRole("link", { name: "ホームへ" })).toHaveAttribute(
    "href",
    "/home",
  );
});
