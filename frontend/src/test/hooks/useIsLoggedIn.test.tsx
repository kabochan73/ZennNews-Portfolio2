import { renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, expect, test } from "vitest";

import { useIsLoggedIn } from "@/hooks/useIsLoggedIn";
import { LOGGED_IN_COOKIE_NAME } from "@/lib/cookie-names";

function setCookie(cookie: string): void {
  document.cookie = cookie;
}

afterEach(() => {
  setCookie(`${LOGGED_IN_COOKIE_NAME}=; max-age=0`);
  setCookie("other=; max-age=0");
});

test("is true when the logged-in hint cookie exists", () => {
  setCookie("other=value");
  setCookie(`${LOGGED_IN_COOKIE_NAME}=1`);

  const { result } = renderHook(() => useIsLoggedIn());

  expect(result.current).toBe(true);
});

test("is false without the hint cookie", () => {
  setCookie("other=value");

  const { result } = renderHook(() => useIsLoggedIn());

  expect(result.current).toBe(false);
});

test("is always false while rendering on the server", () => {
  setCookie(`${LOGGED_IN_COOKIE_NAME}=1`);

  function Probe() {
    return <span>{useIsLoggedIn() ? "in" : "out"}</span>;
  }

  expect(renderToString(<Probe />)).toContain("out");
});
