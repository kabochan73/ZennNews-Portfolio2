import { describe, expect, test } from "vitest";

import { activeNavHref, isWelcomePage } from "@/components/layout/nav";

describe("activeNavHref", () => {
  test.each([
    ["/home", "/home"],
    ["/home/nextjs", "/home"],
    ["/home/react", "/home"],
    ["/home/tags", "/home/tags"],
  ])("%s -> %s", (pathname, expected) => {
    expect(activeNavHref(pathname)).toBe(expected);
  });
});

describe("isWelcomePage", () => {
  test("is true only on /home/tags?welcome=1", () => {
    expect(isWelcomePage("/home/tags", "1")).toBe(true);
  });

  test.each([
    ["/home/tags", null],
    ["/home/tags", "0"],
    ["/home/nextjs", "1"],
    ["/home", "1"],
  ])("%s with welcome=%s is false", (pathname, welcome) => {
    expect(isWelcomePage(pathname, welcome)).toBe(false);
  });
});
