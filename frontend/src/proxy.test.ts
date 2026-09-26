import { NextRequest } from "next/server";
import { expect, test } from "vitest";

import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import { config, proxy } from "@/proxy";

test("redirects to /login without the auth cookie", () => {
  const response = proxy(new NextRequest("http://localhost/home/nextjs"));

  expect(response.status).toBe(307);
  expect(response.headers.get("Location")).toBe("http://localhost/login");
});

test("lets the request through with the auth cookie", () => {
  const request = new NextRequest("http://localhost/home/nextjs", {
    headers: { Cookie: `${AUTH_COOKIE_NAME}=1|secret` },
  });

  const response = proxy(request);

  expect(response.headers.get("Location")).toBeNull();
  expect(response.headers.get("x-middleware-next")).toBe("1");
});

test("runs only for /home and below", () => {
  expect(config.matcher).toBe("/home/:path*");
});
