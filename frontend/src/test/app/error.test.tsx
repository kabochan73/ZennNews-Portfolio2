import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import ErrorPage from "@/app/error";

test("shows an error message, logs the error and links to the top", () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  const error = new Error("boom");

  render(<ErrorPage error={error} />);

  expect(
    screen.getByRole("heading", { name: "エラーが発生しました" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "トップへ" })).toHaveAttribute(
    "href",
    "/",
  );
  expect(consoleError).toHaveBeenCalledWith(error);
  consoleError.mockRestore();
});
